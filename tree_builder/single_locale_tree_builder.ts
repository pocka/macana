// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	DirectoryReader,
	FileReader,
} from "../filesystem_reader/interface.ts";
import type { MetadataParser } from "../metadata_parser/interface.ts";
import type {
	BuildParameters,
	Document,
	DocumentDirectory,
	DocumentTree,
	TreeBuilder,
} from "./interface.ts";

export interface SingleLocaleTreeBuilderConfig {
	/**
	 * Locale string to use.
	 */
	locale: string;

	/**
	 * Callback function to be invoked on every file and directory.
	 * If this function returned true, the file or directory is skipped and does not
	 * appear on the resulted document tree.
	 */
	ignore?(fileOrDirectory: FileReader | DirectoryReader): boolean;
}

export class SingleLocaleTreeBuilder implements TreeBuilder {
	#locale: string;
	#ignore?: (fileOrDirectory: FileReader | DirectoryReader) => boolean;

	constructor({ locale, ignore }: SingleLocaleTreeBuilderConfig) {
		this.#locale = locale;
		this.#ignore = ignore;
	}

	async build(
		{ fileSystemReader, metadataParser }: BuildParameters,
	): Promise<DocumentTree> {
		const root = await fileSystemReader.getRootDirectory();

		const children = await root.read();

		const entries = await Promise.all(
			children.map((child) => this.#build(child, metadataParser)),
		);

		const map = new Map<string, Array<Document | DocumentDirectory>>();
		map.set(
			this.#locale,
			entries.filter((entry): entry is NonNullable<typeof entry> => !!entry),
		);

		return {
			locales: map,
		};
	}

	async #build(
		node: FileReader | DirectoryReader,
		metadataParser: MetadataParser,
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
			return {
				metadata,
				file: node,
			};
		}

		const children = await node.read();

		const entries = await Promise.all(
			children.map((child) => this.#build(child, metadataParser)),
		);

		return {
			metadata,
			directory: node,
			entries: entries.filter((child): child is NonNullable<typeof child> =>
				!!child
			),
		};
	}
}
