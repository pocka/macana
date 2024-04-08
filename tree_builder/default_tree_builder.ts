// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { BuildParameters, TreeBuilder } from "./interface.ts";
import type {
	DirectoryReader,
	Document,
	DocumentDirectory,
	DocumentTree,
	FileReader,
} from "../types.ts";

export interface DefaultTreeBuilderConfig {
	/**
	 * Default language tag (BCP 47).
	 */
	defaultLanguage: string;

	/**
	 * Callback function to be invoked on every file and directory.
	 * If this function returned true, the file or directory is skipped and does not
	 * appear on the resulted document tree.
	 */
	ignore?(fileOrDirectory: FileReader | DirectoryReader): boolean;
}

export class DefaultTreeBuilder implements TreeBuilder {
	#defaultLanguage: string;
	#ignore?: (fileOrDirectory: FileReader | DirectoryReader) => boolean;

	constructor({ defaultLanguage, ignore }: DefaultTreeBuilderConfig) {
		this.#defaultLanguage = defaultLanguage;
		this.#ignore = ignore;
	}

	async build(
		{ fileSystemReader, metadataParser, contentParser }: BuildParameters,
	): Promise<DocumentTree> {
		const root = await fileSystemReader.getRootDirectory();

		const children = await root.read();

		const entries = await Promise.all(
			children.map((child) =>
				this.#build(child, { metadataParser, contentParser })
			),
		);

		return {
			type: "tree",
			nodes: entries.filter((entry): entry is NonNullable<typeof entry> =>
				!!entry
			),
			defaultLanguage: this.#defaultLanguage,
		};
	}

	async #build(
		node: FileReader | DirectoryReader,
		{ metadataParser, contentParser }: Omit<
			BuildParameters,
			"fileSystemReader"
		>,
		parentPath: readonly string[] = [],
	): Promise<DocumentDirectory | Document | null> {
		if (this.#ignore && this.#ignore(node)) {
			// TODO: Debug log
			return null;
		}

		const metadata = await metadataParser.parse(node);

		// This SHOULD have check for `metadata.skip` being `true`. However, a bug
		// (or "feature") in TypeScript breaks type-narrowing by doing so.
		if ("skip" in metadata) {
			// TODO: Debug log
			return null;
		}

		if (node.type === "file") {
			const content = await contentParser.parse({
				fileReader: node,
				documentMetadata: metadata,
			});

			return {
				type: "document",
				metadata,
				file: node,
				content,
				path: [...parentPath, metadata.name],
			};
		}

		const children = await node.read();

		const entries = await Promise.all(
			children.map((child) =>
				this.#build(child, { metadataParser, contentParser }, [
					...parentPath,
					metadata.name,
				])
			),
		);

		return {
			type: "directory",
			metadata,
			directory: node,
			entries: entries.filter((child): child is NonNullable<typeof child> =>
				!!child
			),
			path: [...parentPath, metadata.name],
		};
	}
}
