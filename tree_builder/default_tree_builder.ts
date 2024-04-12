// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { extname } from "../deps/deno.land/std/path/mod.ts";

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

/**
 * Excludes certain files and directories.
 *
 * @param f - If this function returned `true`, the file will be excluded from a document tree.
 */
export function ignore(
	f: (fileOrDirectory: FileReader | DirectoryReader) => boolean,
): TreeBuildStrategy {
	return (node, metadata) => {
		if (f(node)) {
			return { skip: true };
		}

		return { metadata };
	};
}

/**
 * Excludes dotfiles from a document tree.
 */
export function ignoreDotfiles(): TreeBuildStrategy {
	return ignore((node) => node.name.startsWith("."));
}

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
	return typeof token === "string" && token.startsWith("mxd_");
}

function resolveFsrPath(
	path: readonly string[],
	base: readonly string[],
): readonly string[] {
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
}

export class DefaultTreeBuilder implements TreeBuilder {
	#defaultLanguage: string;
	#strategies: readonly TreeBuildStrategy[];
	#sorter: (
		a: Document | DocumentDirectory,
		b: Document | DocumentDirectory,
	) => number;

	constructor(
		{ defaultLanguage, strategies, sorter }: DefaultTreeBuilderConfig,
	) {
		this.#defaultLanguage = defaultLanguage;
		this.#strategies = strategies || [];
		this.#sorter = sorter ||
			((a, b) =>
				a.metadata.title.localeCompare(
					b.metadata.title,
					this.#defaultLanguage,
				));
	}

	async build(
		{ fileSystemReader, contentParser }: BuildParameters,
	): Promise<DocumentTree> {
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

		for (const strategy of this.#strategies) {
			const result = await strategy(node, metadata);
			if (result.skip) {
				// TODO: Debug log (or this should be in the each strategies?)
				return null;
			}

			metadata = result.metadata;
		}

		if (node.type === "file") {
			const result = await contentParser.parse({
				fileReader: node,
				documentMetadata: metadata,
				async getAssetToken(path) {
					const id = crypto.randomUUID();
					const token: AssetToken = `mxa_${id}`;

					assetTokensToFiles.set(
						token,
						await root.openFile(resolveFsrPath(path, node.path)),
					);

					return token;
				},
				getDocumentToken(path) {
					const id = crypto.randomUUID();
					const token: DocumentToken = `mxt_${id}`;

					documentTokenToPaths.set(
						token,
						resolveFsrPath(path, node.path).join(INTERNAL_PATH_SEPARATOR),
					);

					return token;
				},
			});

			const document: Document = {
				type: "document",
				metadata: "documentMetadata" in result
					? result.documentMetadata
					: metadata,
				file: node,
				content: "documentContent" in result ? result.documentContent : result,
				path: [...parentPath, metadata.name],
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
