// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as yamlFrontmatter from "../deps/deno.land/std/front_matter/yaml.ts";
import type * as Mdast from "../deps/esm.sh/mdast/types.ts";
import { fromMarkdown } from "../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import { gfmFromMarkdown } from "../deps/esm.sh/mdast-util-gfm/mod.ts";
import { gfm } from "../deps/esm.sh/micromark-extension-gfm/mod.ts";

import { ofmHighlightFromMarkdown } from "./obsidian_markdown/mdast_util_ofm_highlight.ts";
import { ofmHighlight } from "./obsidian_markdown/micromark_extension_ofm_highlight.ts";
import { ofmImageSize } from "./obsidian_markdown/mdast_util_ofm_image_size.ts";

import type {
	ContentParser,
	ContentParseResult,
	ParseParameters,
} from "./interface.ts";
import type { DocumentContent } from "../types.ts";

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

export type ObsidianMarkdownDocument = DocumentContent<
	"obsidian_markdown",
	Mdast.Nodes
>;

export interface ObsidianMarkdownParserOptions {
	/**
	 * Whether to enable reading of YAML frontmatter.
	 *
	 * ## `title`
	 *
	 * Use property value as a document title.
	 *
	 * ## `name`
	 *
	 * Use property value as a document name.
	 *
	 * ## `lang` / `language`
	 *
	 * Use property value as a document language.
	 *
	 * @default false
	 */
	frontmatter?: boolean;
}

function parseMarkdown(markdown: string | Uint8Array) {
	const mdast = fromMarkdown(markdown, {
		extensions: [gfm(), ofmHighlight()],
		mdastExtensions: [gfmFromMarkdown(), ofmHighlightFromMarkdown()],
	});

	ofmImageSize(mdast);

	return mdast;
}

export class ObsidianMarkdownParser implements ContentParser {
	#frontmatter: boolean;

	constructor({ frontmatter = false }: ObsidianMarkdownParserOptions = {}) {
		this.#frontmatter = frontmatter;
	}

	async parse(
		{ fileReader, documentMetadata }: ParseParameters,
	): Promise<ContentParseResult<ObsidianMarkdownDocument>> {
		const bytes = await fileReader.read();

		if (!this.#frontmatter) {
			return {
				kind: "obsidian_markdown",
				content: parseMarkdown(bytes),
			};
		}

		const frontmatter = yamlFrontmatter.extract(
			new TextDecoder().decode(bytes),
		);

		const name = getFrontMatterValue(frontmatter.attrs, "name");
		const title = getFrontMatterValue(frontmatter.attrs, "title");
		const lang = getFrontMatterValue(frontmatter.attrs, "lang") ||
			getFrontMatterValue(frontmatter.attrs, "language");

		return {
			documentMetadata: {
				name: name || documentMetadata.name,
				title: title || documentMetadata.title,
				language: lang || documentMetadata.language,
			},
			documentContent: {
				kind: "obsidian_markdown",
				content: parseMarkdown(frontmatter.body),
			},
		};
	}
}
