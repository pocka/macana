// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { extname } from "../deps/deno.land/std/path/mod.ts";
import * as yamlFrontmatter from "../deps/deno.land/std/front_matter/yaml.ts";

import type {
	DirectoryReader,
	FileReader,
} from "../filesystem_reader/interface.ts";
import type { DocumentMetadata, MetadataParser, Skip } from "./interface.ts";

function escapeNodeName(nodeName: string): string {
	return encodeURIComponent(nodeName.toLowerCase());
}

function getFrontMatterValue(
	frontmatter: Record<string, unknown>,
	key: string,
): string | undefined {
	if (!(key in frontmatter)) {
		return undefined;
	}

	const value = frontmatter[key];
	if (typeof value !== "string") {
		return undefined;
	}

	return value;
}

export interface VaultParserOptions {
	/**
	 * Whether to read YAML frontmatter of notes.
	 * When enabled,
	 *
	 * - Use `name` property for document name if defined.
	 * - Use `title` property for document title if defined.
	 * - Use `lang` property or `language` property as a document language if defined.
	 *
	 * This flag is off by-default for performance reasons.
	 */
	readFrontMatter?: boolean;

	/**
	 * An optional function to override default parsing behaviour.
	 * If this function returned partial of metadata, Macana prefers it over default parsed metadata.
	 * Metadata extracted from YAML frontmatters overrides the metadata this function returned.
	 */
	override?(
		node: FileReader | DirectoryReader,
	): Partial<DocumentMetadata> | false | null | undefined;
}

/**
 * A parser for Obsidian Vault.
 *
 * By default, this parser uses file and directory name as document title
 * and lowercased escaped one as document name.
 */
export class VaultParser implements MetadataParser {
	#readFrontMatter: boolean;
	#override: VaultParserOptions["override"];

	constructor({ readFrontMatter = false, override }: VaultParserOptions = {}) {
		this.#readFrontMatter = readFrontMatter;
		this.#override = override;
	}

	async parse(
		node: FileReader | DirectoryReader,
	): Promise<DocumentMetadata | Skip> {
		const overrides = this.#override?.(node) || null;

		if (node.type === "directory") {
			return {
				name: overrides?.name || escapeNodeName(node.name),
				title: overrides?.title || node.name,
				language: overrides?.language,
			};
		}

		const ext = extname(node.name);
		const basename = ext ? node.name.slice(0, -ext.length) : node.name;

		switch (ext) {
			case ".md": {
				const fromFileName: DocumentMetadata = {
					name: overrides?.name || escapeNodeName(basename),
					title: overrides?.title || basename,
					language: overrides?.language,
				};

				if (this.#readFrontMatter) {
					const parsed = await this.#parseFrontMatter(node);

					return {
						name: parsed.name || fromFileName.name,
						title: parsed.title || fromFileName.title,
						language: parsed.language || fromFileName.language,
					};
				}

				return fromFileName;
			}
			case ".canvas": {
				return {
					name: overrides?.name || escapeNodeName(basename),
					title: overrides?.title || basename,
					language: overrides?.language,
				};
			}
			// Not an Obsidian document.
			default: {
				return {
					skip: true,
				};
			}
		}
	}

	async #parseFrontMatter(
		file: FileReader,
	): Promise<Partial<DocumentMetadata>> {
		const markdown = new TextDecoder().decode(await file.read());

		// Obsidian currently supports YAML frontmatter only.
		const frontmatter = yamlFrontmatter.extract(markdown);

		const name = getFrontMatterValue(frontmatter.attrs, "name");
		const title = getFrontMatterValue(frontmatter.attrs, "title");
		const language = getFrontMatterValue(frontmatter.attrs, "lang") ||
			getFrontMatterValue(frontmatter.attrs, "language");

		return { name, title, language };
	}
}
