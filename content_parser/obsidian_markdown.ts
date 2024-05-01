// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { test as testFrontmatter } from "../deps/deno.land/std/front_matter/test.ts";
import * as yamlFrontmatter from "../deps/deno.land/std/front_matter/yaml.ts";
import type * as Mdast from "../deps/esm.sh/mdast/types.ts";
import { fromMarkdown } from "../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import { toString } from "../deps/esm.sh/mdast-util-to-string/mod.ts";
import { headingRange } from "../deps/esm.sh/mdast-util-heading-range/mod.ts";
import { find as findNode } from "../deps/esm.sh/unist-util-find/mod.ts";

import { ofm } from "./obsidian_markdown/micromark_extension_ofm.ts";
import {
	type OfmBlockIdentifier,
	ofmFromMarkdown,
} from "./obsidian_markdown/mdast_util_ofm.ts";
import { macanaMarkAssets } from "./obsidian_markdown/mdast_util_macana_mark_assets.ts";
import { macanaMarkDocumentToken } from "./obsidian_markdown/mdast_util_macana_mark_document_token.ts";
import { autoHeadingIdFromMarkdown } from "./obsidian_markdown/mdast_util_auto_heading_id.ts";

import { logger } from "../logger.ts";

import type {
	ContentParser,
	ContentParseResult,
	ParseParameters,
} from "./interface.ts";
import type { DocumentContent } from "../types.ts";

export { macanaReplaceAssetTokens } from "./obsidian_markdown/mdast_util_macana_replace_asset_tokens.ts";
export { macanaReplaceDocumentToken } from "./obsidian_markdown/mdast_util_macana_replace_document_tokens.ts";
export { ofmToHastHandlers } from "./obsidian_markdown/mdast_util_ofm.ts";
export { ofmHtml } from "./obsidian_markdown/hast_util_ofm_html.ts";
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
		mdastExtensions: [ofmFromMarkdown(), autoHeadingIdFromMarkdown()],
	});

	await macanaMarkAssets(mdast, getAssetToken);
	await macanaMarkDocumentToken(mdast, getDocumentToken);

	return mdast;
}

function findNodeId(
	root: Mdast.Root,
	selectors: readonly string[],
): string | null {
	if (!selectors.length) {
		return null;
	}

	const [selector, ...rest] = selectors;

	if (selector.startsWith("^")) {
		const ident = selector.slice(1);

		const found = findNode(root, (node) => (
			!!(node.data && node.type === "ofmBlockIdentifier" &&
				(node as OfmBlockIdentifier).value === ident)
		));

		if (!found) {
			logger().error(
				`Macana couldn't find a block having a block ID "${selector}".` +
					` You have to manually define the block identifier at the target location.`,
				{ selector },
			);
			return null;
		}

		return ident;
	}

	const text = toString(fromMarkdown(selector, {
		extensions: [ofm()],
		mdastExtensions: [ofmFromMarkdown()],
	}));

	let found: string | null = null;

	headingRange(
		root,
		(textContent) => textContent === text,
		(start, nodes) => {
			if (rest.length) {
				found = findNodeId({ type: "root", children: nodes }, rest);
				return;
			}

			if (
				!start.data || !("hProperties" in start.data) ||
				typeof start.data.hProperties !== "object" || !start.data.hProperties ||
				!("id" in start.data.hProperties) ||
				typeof start.data.hProperties.id !== "string"
			) {
				return;
			}

			found = start.data.hProperties.id;
			return;
		},
	);

	return found;
}

async function ok(
	markdown: string | Uint8Array,
	{ fileReader, getDocumentToken, getAssetToken }: Pick<
		ParseParameters,
		"getAssetToken" | "getDocumentToken" | "fileReader"
	>,
): Promise<ObsidianMarkdownDocument> {
	const mdast = await parseMarkdown(markdown, {
		getDocumentToken,
		getAssetToken,
	});

	return {
		kind: "obsidian_markdown",
		content: mdast,
		getHash(selectors) {
			const id = findNodeId(mdast, selectors);
			if (!id) {
				const filepath = fileReader.path.join("/");

				throw new Error(
					`${filepath} does not contain heading or custom block matching "${
						selectors.join(" > ")
					}".`,
				);
			}

			return id;
		},
	};
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
			return ok(bytes, { getDocumentToken, getAssetToken, fileReader });
		}

		const decoded = new TextDecoder().decode(bytes);
		if (!testFrontmatter(decoded)) {
			return ok(bytes, { getDocumentToken, getAssetToken, fileReader });
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
			documentContent: await ok(frontmatter.body, {
				getDocumentToken,
				getAssetToken,
				fileReader,
			}),
		};
	}
}
