// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../deps/esm.sh/mdast/types.ts";
import { fromMarkdown } from "../deps/esm.sh/mdast-util-from-markdown/mod.ts";

import type {
	ContentParser,
	DocumentContent,
	ParseParameters,
} from "./interface.ts";

export type ObsidianMarkdownDocument = DocumentContent<
	"obsidian_markdown",
	Mdast.Nodes
>;

export class ObsidianMarkdownParser implements ContentParser {
	async parse(
		{ fileReader }: ParseParameters,
	): Promise<ObsidianMarkdownDocument> {
		return {
			kind: "obsidian_markdown",
			content: fromMarkdown(await fileReader.read()),
		};
	}
}
