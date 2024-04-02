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

export interface VaultParserOptions {
	/**
	 * Whether to read YAML frontmatter of notes.
	 * When enabled,
	 *
	 * - Use `name` property for document name if defined.
	 * - Use `title` property for document title if defined.
	 *
	 * This flag is off by-default for performance reasons.
	 */
	readFrontMatter?: boolean;
}

/**
 * A parser for Obsidian Vault.
 *
 * By default, this parser uses file and directory name as document title
 * and lowercased escaped one as document name.
 */
export class VaultParser implements MetadataParser {
	#readFrontMatter: boolean;

	constructor({ readFrontMatter = false }: VaultParserOptions = {}) {
		this.#readFrontMatter = readFrontMatter;
	}

	async parse(
		node: FileReader | DirectoryReader,
	): Promise<DocumentMetadata | Skip> {
		if (node.type === "directory") {
			return {
				name: escapeNodeName(node.name),
				title: node.name,
			};
		}

		const ext = extname(node.name);
		const basename = ext ? node.name.slice(0, -ext.length) : node.name;

		switch (ext) {
			case ".md": {
				const fromFileName: DocumentMetadata = {
					name: escapeNodeName(basename),
					title: basename,
				};

				if (this.#readFrontMatter) {
					const parsed = await this.#parseFrontMatter(node);

					return {
						name: parsed.name || fromFileName.name,
						title: parsed.title || fromFileName.title,
					};
				}

				return fromFileName;
			}
			case ".canvas": {
				return {
					name: escapeNodeName(basename),
					title: basename,
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

		const name = ("name" in frontmatter.attrs &&
			typeof frontmatter.attrs.name === "string" && frontmatter.attrs.name) ||
			undefined;

		const title = ("title" in frontmatter.attrs &&
			typeof frontmatter.attrs.title === "string" &&
			frontmatter.attrs.title) || undefined;

		return { name, title };
	}
}
