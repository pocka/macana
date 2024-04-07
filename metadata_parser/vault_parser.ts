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
	 * A optional function to determine the language of a directory or a file.
	 * Macana does not check whether the resulted language tag is valid.
	 * @returns If this function returned a falsy value, Macana treat the directory or the file
	 *          has no specified language. If this function returned `true`, Macana uses the file
	 *          name or directory name as a language. If this function returned string, Macana
	 *          uses the string as a language.
	 */
	language?(
		node: FileReader | DirectoryReader,
	): string | true | null | undefined | false;
}

/**
 * A parser for Obsidian Vault.
 *
 * By default, this parser uses file and directory name as document title
 * and lowercased escaped one as document name.
 */
export class VaultParser implements MetadataParser {
	#readFrontMatter: boolean;
	#language: VaultParserOptions["language"];

	constructor({ readFrontMatter = false, language }: VaultParserOptions = {}) {
		this.#readFrontMatter = readFrontMatter;
		this.#language = language;
	}

	async parse(
		node: FileReader | DirectoryReader,
	): Promise<DocumentMetadata | Skip> {
		if (node.type === "directory") {
			return {
				name: escapeNodeName(node.name),
				title: node.name,
				language: this.#getLanguage(node),
			};
		}

		const ext = extname(node.name);
		const basename = ext ? node.name.slice(0, -ext.length) : node.name;

		switch (ext) {
			case ".md": {
				const fromFileName: DocumentMetadata = {
					name: escapeNodeName(basename),
					title: basename,
					language: this.#getLanguage(node),
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
					name: escapeNodeName(basename),
					title: basename,
					language: this.#getLanguage(node),
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

	#getLanguage(node: FileReader | DirectoryReader): string | undefined {
		if (!this.#language) {
			return undefined;
		}

		const result = this.#language(node);
		if (!result) {
			return undefined;
		}

		if (typeof result === "string") {
			return result;
		}

		return node.name;
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
