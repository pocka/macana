// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { test as testFrontmatter } from "../deps/deno.land/std/front_matter/test.ts";
import * as yamlFrontmatter from "../deps/deno.land/std/front_matter/yaml.ts";
import type * as Mdast from "../deps/esm.sh/mdast/types.ts";
import { fromMarkdown } from "../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import { gfmFromMarkdown } from "../deps/esm.sh/mdast-util-gfm/mod.ts";

import { ofm } from "./obsidian_markdown/micromark_extension_ofm.ts";
import { ofmHighlightFromMarkdown } from "./obsidian_markdown/mdast_util_ofm_highlight.ts";
import { ofmImageSize } from "./obsidian_markdown/mdast_util_ofm_image_size.ts";
import { ofmWikilinkFromMarkdown } from "./obsidian_markdown/mdast_util_ofm_wikilink.ts";
import { ofmCommentFromMarkdown } from "./obsidian_markdown/mdast_util_ofm_comment.ts";
import { macanaMarkAssets } from "./obsidian_markdown/mdast_util_macana_mark_assets.ts";
import { macanaMarkDocumentToken } from "./obsidian_markdown/mdast_util_macana_mark_document_token.ts";
import { ofmCalloutFromMarkdown } from "./obsidian_markdown/mdast_util_ofm_callout.ts";

import type {
	ContentParser,
	ContentParseResult,
	ParseParameters,
} from "./interface.ts";
import type { DocumentContent } from "../types.ts";

export { macanaReplaceAssetTokens } from "./obsidian_markdown/mdast_util_macana_replace_asset_tokens.ts";
export { macanaReplaceDocumentToken } from "./obsidian_markdown/mdast_util_macana_replace_document_tokens.ts";
export { ofmWikilinkToHastHandlers } from "./obsidian_markdown/mdast_util_ofm_wikilink.ts";
export { ofmCalloutToHastHandlers } from "./obsidian_markdown/mdast_util_ofm_callout.ts";
export { ofmCommentToHastHandlers } from "./obsidian_markdown/mdast_util_ofm_comment.ts";
export type { CalloutType } from "./obsidian_markdown/mdast_util_ofm_callout.ts";

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

function getFrontMatterDate(
	frontmatter: Record<string, unknown>,
	key: string,
): Date | undefined {
	if (!(key in frontmatter)) {
		return undefined;
	}

	const value = frontmatter[key];
	if (!(value instanceof Date) || isNaN(+value)) {
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
	 * ## `createdAt` / `updatedAt`
	 *
	 * Use property values as corresponding metadata dates.
	 *
	 * @default false
	 */
	frontmatter?: boolean;
}

export async function parseMarkdown(
	markdown: string | Uint8Array,
	{ getAssetToken, getDocumentToken }: Pick<
		ParseParameters,
		"getAssetToken" | "getDocumentToken"
	>,
): Promise<Mdast.Root> {
	const mdast = fromMarkdown(markdown, {
		extensions: [ofm()],
		mdastExtensions: [
			ofmCommentFromMarkdown(),
			gfmFromMarkdown(),
			ofmHighlightFromMarkdown(),
			ofmWikilinkFromMarkdown(),
			ofmCalloutFromMarkdown(),
			ofmImageSize(),
		],
	});

	await macanaMarkAssets(mdast, getAssetToken);
	await macanaMarkDocumentToken(mdast, getDocumentToken);

	return mdast;
}

export class ObsidianMarkdownParser
	implements ContentParser<ObsidianMarkdownDocument> {
	#frontmatter: boolean;

	constructor({ frontmatter = false }: ObsidianMarkdownParserOptions = {}) {
		this.#frontmatter = frontmatter;
	}

	async parse(
		{ fileReader, documentMetadata, getDocumentToken, getAssetToken }:
			ParseParameters,
	): Promise<ContentParseResult<ObsidianMarkdownDocument>> {
		const bytes = await fileReader.read();

		if (!this.#frontmatter) {
			return {
				kind: "obsidian_markdown",
				content: await parseMarkdown(bytes, {
					getDocumentToken,
					getAssetToken,
				}),
			};
		}

		const decoded = new TextDecoder().decode(bytes);
		if (!testFrontmatter(decoded)) {
			return {
				kind: "obsidian_markdown",
				content: await parseMarkdown(bytes, {
					getDocumentToken,
					getAssetToken,
				}),
			};
		}

		const frontmatter = yamlFrontmatter.extract(decoded);

		const name = getFrontMatterValue(frontmatter.attrs, "name");
		const title = getFrontMatterValue(frontmatter.attrs, "title");
		const lang = getFrontMatterValue(frontmatter.attrs, "lang") ||
			getFrontMatterValue(frontmatter.attrs, "language");
		const createdAt = getFrontMatterDate(frontmatter.attrs, "createdAt");
		const updatedAt = getFrontMatterDate(frontmatter.attrs, "updatedAt");

		return {
			documentMetadata: {
				...documentMetadata,
				name: name || documentMetadata.name,
				title: title || documentMetadata.title,
				language: lang || documentMetadata.language,
				createdAt: createdAt || documentMetadata.createdAt,
				updatedAt: updatedAt || documentMetadata.updatedAt,
			},
			documentContent: {
				kind: "obsidian_markdown",
				content: await parseMarkdown(frontmatter.body, {
					getAssetToken,
					getDocumentToken,
				}),
			},
		};
	}
}
