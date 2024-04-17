// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { extname } from "../deps/deno.land/std/path/mod.ts";

import { logger } from "../logger.ts";

import type { BuildParameters, TreeBuilder } from "./interface.ts";
import type {
	AssetToken,
	DirectoryReader,
	Document,
	DocumentDirectory,
	DocumentMetadata,
	DocumentToken,
	DocumentTree,
	FileReader,
	RootDirectoryReader,
} from "../types.ts";

const INTERNAL_PATH_SEPARATOR = "/";

/**
 * Function to decide whether the file or directory should be completely removed
 * from file operations. This is different than returning `{ skip: true }` in
 * strategies: this even disallows the load of asset files matching to this.
 */
export interface IgnoreFunction {
	(
		fileOrDirectory: FileReader | DirectoryReader,
		metadata?: DocumentMetadata,
	): boolean;
}

export type TreeBuildStrategyFunctionReturns = {
	skip: true;
} | {
	skip?: false;
	metadata: DocumentMetadata;
};

export interface TreeBuildStrategy {
	(
		fileOrDirectory: FileReader | DirectoryReader,
		metadata: DocumentMetadata,
	):
		| TreeBuildStrategyFunctionReturns
		| Promise<TreeBuildStrategyFunctionReturns>;
}

/**
 * Only accepts files having specific file extension.
 * Files not having an extension in the list will be excluded from a document tree.
 *
 * @param exts - A list of file extensions, including leading dot.
 */
export function fileExtensions(exts: readonly string[]): TreeBuildStrategy {
	return (node, metadata) => {
		if (node.type !== "file") {
			return { metadata };
		}

		if (exts.some((ext) => node.name.endsWith(ext))) {
			return { metadata };
		}

		return { skip: true };
	};
}

export const ignoreDotfiles: IgnoreFunction = (node) => {
	return node.name.startsWith(".");
};

export function langDir(
	langs: Record<string, string>,
	topLevelOnly: boolean = false,
): TreeBuildStrategy {
	const map = new Map(Object.entries(langs));

	return (node, metadata) => {
		if (topLevelOnly && node.parent.type !== "root") {
			return { metadata };
		}

		if (node.type !== "directory") {
			return { metadata };
		}

		const title = map.get(node.name);
		if (!title) {
			return { metadata };
		}

		logger().debug(
			`Found language directory at ${node.path.join(INTERNAL_PATH_SEPARATOR)}`,
			{
				path: node.path,
				language: node.name,
			},
		);

		return {
			metadata: {
				...metadata,
				title,
				language: node.name,
			},
		};
	};
}

/**
 * Do not include file extension in the metadata.
 * For example, "Bar.md" will be `{ title: "Bar", name: "Bar" }`.
 */
export function removeExtFromMetadata(): TreeBuildStrategy {
	return (node, metadata) => {
		if (node.type !== "file") {
			return { metadata };
		}

		const ext = extname(node.name);
		const stem = ext ? node.name.slice(0, -ext.length) : node.name;

		return {
			metadata: {
				...metadata,
				title: stem,
				name: stem,
			},
		};
	};
}

/**
 * Mark file at specific path to be the default document.
 *
 * @param path - Relative path from the root directory (FileSystem Reader).
 */
export function defaultDocumentAt(path: readonly string[]): TreeBuildStrategy {
	return (node, metadata) => {
		if (node.type !== "file") {
			return { metadata };
		}

		if (node.path.every((segment, i) => segment === path[i])) {
			return {
				metadata: {
					...metadata,
					isDefaultDocument: true,
				},
			};
		}

		return { metadata };
	};
}

function isAssetToken(token: unknown): token is AssetToken {
	return typeof token === "string" && token.startsWith("mxa_");
}

function isDocumentToken(token: unknown): token is DocumentToken {
	return typeof token === "string" && token.startsWith("mxt_");
}

function resolveFsrPath(
	path: readonly string[],
	base: readonly string[],
): readonly string[] {
	// Absolute path
	if (path[0] === "") {
		return path.slice(1);
	}

	let buf: string[] = base.slice(0, -1);

	for (const fragment of path) {
		switch (fragment) {
			case ".":
				break;
			case "..":
				buf = buf.slice(0, -1);
				break;
			default:
				buf.push(fragment);
				break;
		}
	}

	return buf;
}

/**
 * Trim file extension from filename.
 *
 * - "foo.png" -> "foo"
 * - "foo.config.js" -> "foo.config"
 */
function getStem(filename: string): string {
	return filename.split(".").slice(0, -1).join(".");
}

/**
 * @param root - Vault root directory.
 * @param path - Resolved path.
 */
function resolveExtensionLessPath(
	root: RootDirectoryReader,
	path: readonly string[],
): readonly string[] | Promise<readonly string[]> {
	const [filename, ...dirPathReversed] = path.toReversed();
	if (!filename || filename.includes(".")) {
		return path;
	}

	const findClosestFile = async (
		dir: DirectoryReader | RootDirectoryReader,
	): Promise<readonly string[]> => {
		const entries = await dir.read();

		const match = entries.filter((entry) => {
			if (entry.type !== "file") {
				return false;
			}

			return getStem(entry.name) === filename;
		});

		if (match.length > 1) {
			// TODO: Custom error class
			throw new Error(
				"DefaultTreeBuilder: cannot resolve extension-less reference, " +
					"there is several files with same stem but different extensions: " +
					`requested = ${path.join(INTERNAL_PATH_SEPARATOR)},	` +
					`found = [${match.map((entry) => entry.name).join(", ")}].`,
			);
		}

		if (!match.length) {
			const dirPath = dirPathReversed.length > 0
				? dirPathReversed.toReversed().join(
					INTERNAL_PATH_SEPARATOR,
				)
				: "Root directory ";

			throw new Error(
				"DefaultTreeBuilder: cannot resolve extension-less reference, " +
					`${dirPath} does not contain any files whose stem is "${filename}".`,
			);
		}

		return match[0].path;
	};

	const dir = !dirPathReversed.length
		? root
		: root.openDirectory(dirPathReversed.toReversed());
	if (dir instanceof Promise) {
		return dir.then(findClosestFile);
	}

	return findClosestFile(dir);
}

async function findFileByName(
	name: string,
	dir: DirectoryReader | RootDirectoryReader,
	ignore: readonly IgnoreFunction[],
): Promise<FileReader[]> {
	const found: FileReader[] = [];

	for (const entry of await dir.read()) {
		if (ignore.some((f) => f(entry))) {
			continue;
		}

		if (entry.type === "directory") {
			found.push(...(await findFileByName(name, entry, ignore)));
			continue;
		}

		if (getStem(entry.name) === name) {
			found.push(entry);
			continue;
		}
	}

	return found;
}

// Based on: https://forum.obsidian.md/t/settings-new-link-format-what-is-shortest-path-when-possible/6748
function resolveShortestPath(
	root: RootDirectoryReader,
	path: readonly string[],
	base: readonly string[],
	ignore: readonly IgnoreFunction[],
): readonly string[] | Promise<readonly string[]> {
	const [name] = path;
	switch (name) {
		case "":
		case ".":
		case "..":
			return resolveExtensionLessPath(root, resolveFsrPath(path, base));
	}

	// Absolute path from Vault root
	if (path.length > 1) {
		return resolveExtensionLessPath(root, path);
	}

	return findFileByName(name, root, ignore).then((found) => {
		if (!found.length) {
			throw new Error(
				`DefaultTreeBuilder: no file named "${name}" found,` +
					` requested by ${base.join(INTERNAL_PATH_SEPARATOR)}.`,
			);
		}

		if (found.length > 1) {
			throw new Error(
				`DefaultTreeBuilder: Your Vault has more than one files named "${name}": ` +
					found.map((entry) => entry.path.join(INTERNAL_PATH_SEPARATOR)).join(
						", ",
					),
			);
		}

		return found[0].path;
	});
}

interface InternalBuildParameters {
	contentParser: BuildParameters["contentParser"];

	root: RootDirectoryReader;

	parentPath?: readonly string[];

	assetTokensToFiles: Map<AssetToken, FileReader>;
	documentTokenToPaths: Map<DocumentToken, string>;
	pathToDocuments: Map<string, Document>;
}

export interface DefaultTreeBuilderConfig {
	/**
	 * Default language tag (BCP 47).
	 */
	defaultLanguage: string;

	/**
	 * A function or a list of functions that controls whether the file or directory
	 * should be removed from file operations completely.
	 */
	ignore?: IgnoreFunction | readonly IgnoreFunction[];

	/**
	 * A list of callback functions that control whether a file or a directory should be
	 * included in the document tree and override document metadata.
	 */
	strategies?: readonly TreeBuildStrategy[];

	/**
	 * Sort function for document and document directory.
	 * This function is directly passed to `Array.prototype.toSorted`.
	 * @default A function compares `metadata.title` using `String.prototype.localeCompare` with default language as a locale.
	 */
	sorter?(
		a: Document | DocumentDirectory,
		b: Document | DocumentDirectory,
	): number;

	/**
	 * Whether to enable "Shortest path when possible" link resolution.
	 * This impacts performance.
	 * @default false
	 */
	resolveShortestPathWhenPossible?: boolean;
}

export class DefaultTreeBuilder implements TreeBuilder {
	#defaultLanguage: string;
	#strategies: readonly TreeBuildStrategy[];
	#sorter: (
		a: Document | DocumentDirectory,
		b: Document | DocumentDirectory,
	) => number;
	#resolveShortestPath: boolean;
	#ignore: readonly IgnoreFunction[];

	constructor(
		{
			defaultLanguage,
			strategies,
			sorter,
			resolveShortestPathWhenPossible,
			ignore,
		}: DefaultTreeBuilderConfig,
	) {
		this.#defaultLanguage = defaultLanguage;
		this.#strategies = strategies || [];
		this.#sorter = sorter ||
			((a, b) =>
				a.metadata.title.localeCompare(
					b.metadata.title,
					this.#defaultLanguage,
				));
		this.#resolveShortestPath = resolveShortestPathWhenPossible ?? false;
		this.#ignore = Array.isArray(ignore) ? ignore : ignore ? [ignore] : [];
	}

	async build(
		{ fileSystemReader, contentParser }: BuildParameters,
	): Promise<DocumentTree> {
		const start = performance.now();
		const root = await fileSystemReader.getRootDirectory();

		const assetTokensToFiles = new Map<AssetToken, FileReader>();
		const documentTokenToPaths = new Map<DocumentToken, string>();
		const pathToDocuments = new Map<string, Document>();

		const children = await root.read();

		const entries = await Promise.all(
			children.map((child) =>
				this.#build(child, {
					contentParser,
					root,
					assetTokensToFiles,
					documentTokenToPaths,
					pathToDocuments,
				})
			),
		);

		const nodes = entries.filter((entry): entry is NonNullable<typeof entry> =>
			!!entry
		).toSorted(this.#sorter);

		const defaultDocument = this.#findDefaultDocument(nodes);
		if (!defaultDocument) {
			throw new Error(
				"No document found. Document tree must have at least one document.",
			);
		}

		logger().debug(
			`Default document at ${
				defaultDocument.file.path.join(INTERNAL_PATH_SEPARATOR)
			}`,
			{
				path: defaultDocument.file.path,
				documentPath: defaultDocument.path,
				title: defaultDocument.metadata.title,
			},
		);

		const duration = performance.now() - start;
		logger().info(`Built document tree in ${duration}ms`, {
			duration,
			documents: flattenTree(nodes).length,
		});

		return {
			type: "tree",
			nodes,
			defaultDocument,
			defaultLanguage: this.#defaultLanguage,
			exchangeToken: ((token) => {
				if (isAssetToken(token)) {
					const found = assetTokensToFiles.get(token);
					if (!found) {
						throw new Error(
							`DefaultTreeBuilder: No asset file correspond to Asset Token ${token}`,
						);
					}

					return found;
				}

				if (isDocumentToken(token)) {
					const path = documentTokenToPaths.get(token);
					if (!path) {
						throw new Error(
							`DefaultTreeBuilder: No document path registered for the Document Token ${token}`,
						);
					}

					const doc = pathToDocuments.get(path);
					if (!doc) {
						throw new Error(
							`DefaultTreeBuilder: No document at the path ${path}, referenced by token ${token}`,
						);
					}

					return doc;
				}

				throw new Error(`DefaultTreeBuilder: Invalid token type: ${token}`);
			}) as DocumentTree["exchangeToken"],
		};
	}

	async #build(
		node: FileReader | DirectoryReader,
		{
			contentParser,
			root,
			assetTokensToFiles,
			documentTokenToPaths,
			pathToDocuments,
			parentPath = [],
		}: InternalBuildParameters,
	): Promise<DocumentDirectory | Document | null> {
		let metadata: DocumentMetadata = {
			name: node.name,
			title: node.name,
		};

		for (const ignore of this.#ignore) {
			if (ignore(node, metadata)) {
				logger().debug(`Ignored ${node.path.join(INTERNAL_PATH_SEPARATOR)}`, {
					path: node.path,
				});
				return null;
			}
		}

		for (const strategy of this.#strategies) {
			const result = await strategy(node, metadata);
			if (result.skip) {
				return null;
			}

			metadata = result.metadata;
		}

		if (node.type === "file") {
			const result = await contentParser.parse({
				fileReader: node,
				documentMetadata: metadata,
				getAssetToken: async (path) => {
					if (!path.length) {
						throw new Error(
							`Asset link cannot be empty (processing ${
								node.path.join(INTERNAL_PATH_SEPARATOR)
							})`,
						);
					}

					const id = crypto.randomUUID();
					const token: AssetToken = `mxa_${id}`;

					const resolvedPath = this.#resolveShortestPath
						? await resolveShortestPath(root, path, node.path, this.#ignore)
						: await resolveExtensionLessPath(
							root,
							resolveFsrPath(path, node.path),
						);

					const file = await root.openFile(resolvedPath);
					for (const f of this.#ignore) {
						if (f(file)) {
							throw new Error(
								`Requested asset ${
									resolvedPath.join(INTERNAL_PATH_SEPARATOR)
								} exists,` +
									` but the file is ignored.`,
							);
						}
					}

					assetTokensToFiles.set(
						token,
						await root.openFile(resolvedPath),
					);

					return token;
				},
				getDocumentToken: async (path) => {
					if (!path.length) {
						throw new Error(
							`Document link cannot be empty (processing ${
								node.path.join(INTERNAL_PATH_SEPARATOR)
							})`,
						);
					}

					const id = crypto.randomUUID();
					const token: DocumentToken = `mxt_${id}`;

					const resolvedPath = this.#resolveShortestPath
						? await resolveShortestPath(root, path, node.path, this.#ignore)
						: await resolveExtensionLessPath(
							root,
							resolveFsrPath(path, node.path),
						);

					documentTokenToPaths.set(
						token,
						resolvedPath.join(INTERNAL_PATH_SEPARATOR),
					);

					return token;
				},
			});

			const finalMetadata: DocumentMetadata = "documentMetadata" in result
				? result.documentMetadata
				: metadata;

			const document: Document = {
				type: "document",
				metadata: finalMetadata,
				file: node,
				content: "documentContent" in result ? result.documentContent : result,
				path: [...parentPath, finalMetadata.name],
			};

			pathToDocuments.set(node.path.join(INTERNAL_PATH_SEPARATOR), document);

			return document;
		}

		const children = await node.read();

		const entries = await Promise.all(
			children.map((child) =>
				this.#build(child, {
					contentParser,
					root,
					assetTokensToFiles,
					documentTokenToPaths,
					pathToDocuments,
					parentPath: [
						...parentPath,
						metadata.name,
					],
				})
			),
		);

		const includingEntries = entries.filter((
			child,
		): child is NonNullable<typeof child> => !!child).toSorted(this.#sorter);

		if (!includingEntries.length) {
			return null;
		}

		return {
			type: "directory",
			metadata,
			directory: node,
			entries: includingEntries,
			path: [...parentPath, metadata.name],
		};
	}

	#findDefaultDocument(
		tree: ReadonlyArray<Document | DocumentDirectory>,
		depth: number = 0,
		registry: Map<number, Document> | null = null,
	): Document | null {
		const map = registry || new Map<number, Document>();

		for (const item of tree) {
			if (item.type === "document") {
				if (item.metadata.isDefaultDocument) {
					return item;
				}

				if (!map.has(depth)) {
					map.set(depth, item);
				}

				continue;
			}

			const found = this.#findDefaultDocument(item.entries, depth + 1, map);
			if (found) {
				return found;
			}
		}

		if (depth === 0) {
			const topmost = Array.from(map.entries()).toSorted(([a], [b]) =>
				a - b
			)[0];
			if (!topmost) {
				return null;
			}

			return topmost[1];
		}

		return null;
	}
}

function flattenTree(
	tree: ReadonlyArray<Document | DocumentDirectory>,
): readonly Document[] {
	return tree.map((node) => {
		if (node.type === "document") {
			return [node];
		}

		return flattenTree(node.entries);
	}).flat();
}
