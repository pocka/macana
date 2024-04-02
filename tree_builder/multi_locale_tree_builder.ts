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

export interface MultiLocaleTreeBuilderConfig {
	defaultLocale?: string;

	/**
	 * Callback function to be invoked on every file and directory.
	 * If this function returned true, the file or directory is skipped and does not
	 * appear on the resulted document tree.
	 */
	ignore?(fileOrDirectory: FileReader | DirectoryReader): boolean;
}

export class MultiLocaleTreeBuilder implements TreeBuilder {
	#config: MultiLocaleTreeBuilderConfig;

	constructor(config: MultiLocaleTreeBuilderConfig = {}) {
		this.#config = config;
	}

	async build(
		{ fileSystemReader, metadataParser }: BuildParameters,
	): Promise<DocumentTree> {
		const root = await fileSystemReader.getRootDirectory();

		const nodes = await root.read();

		const map = new Map<string, Array<Document | DocumentDirectory>>();

		for (const node of nodes) {
			if (this.#config.ignore && this.#config.ignore(node)) {
				// TODO: Debug log
				continue;
			}

			if (node.type === "file") {
				// TODO: Warning instead?
				throw new Error(
					`You can't have a regular file at top-level directory, found "${node.name}".`,
				);
			}

			const locale = node.name;

			// Simple BCP 47 language tag check, based on RFC 4646 (Tags for Identifying Languages)
			// https://www.rfc-editor.org/rfc/rfc4646.txt
			if (!(/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(locale))) {
				// TODO: Warning instead?
				throw new Error(`Invalid BCP 47 language tag, found "${locale}".`);
			}

			const children = await node.read();
			const entries = await Promise.all(
				children.map((child) => this.#build(child, metadataParser)),
			);

			map.set(
				locale,
				entries.filter((entry): entry is NonNullable<typeof entry> => !!entry),
			);
		}

		const firstLocale = map.keys().next().value;
		if (typeof firstLocale !== "string") {
			throw new Error("No locale directories found.");
		}

		if (this.#config.defaultLocale && !map.has(this.#config.defaultLocale)) {
			throw new Error(
				`Received defaultLocale=${this.#config.defaultLocale}, however we couldn't find that locale (found ${
					Array.from(map.keys()).join(", ")
				}).`,
			);
		}

		return {
			defaultLocale: this.#config.defaultLocale || firstLocale,
			locales: map,
		};
	}

	async #build(
		node: FileReader | DirectoryReader,
		metadataParser: MetadataParser,
	): Promise<DocumentDirectory | Document | null> {
		if (this.#config.ignore && this.#config.ignore(node)) {
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
