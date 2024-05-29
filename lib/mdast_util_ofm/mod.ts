// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { Extension } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import { gfmFromMarkdown } from "../../deps/esm.sh/mdast-util-gfm/mod.ts";
import { mathFromMarkdown } from "../../deps/esm.sh/mdast-util-math/mod.ts";

import {
	ofmBlockIdentifierFromMarkdown,
	type OfmBlockIdentifierFromMarkdownOptions,
	ofmBlockIdentifierToHastHandlers,
	type OfmBlockIdentifierToHastHandlersOptions,
} from "../mdast_util_ofm_block_identifier/mod.ts";
import {
	ofmCommentFromMarkdown,
	ofmCommentToHastHandlers,
	type OfmCommentToHastHandlersOptions,
} from "../mdast_util_ofm_comment/mod.ts";
import { ofmHighlightFromMarkdown } from "../mdast_util_ofm_highlight/mod.ts";
import {
	ofmWikilinkFromMarkdown,
	ofmWikilinkToHastHandlers,
} from "../mdast_util_ofm_wikilink/mod.ts";
import {
	ofmCalloutFromMarkdown,
	ofmCalloutToHastHandlers,
	type OfmCalloutToHastHandlersOptions,
} from "../mdast_util_ofm_callout/mod.ts";
import { ofmImageSize } from "../mdast_util_ofm_image_size/mod.ts";

export type { OfmBlockIdentifier } from "../mdast_util_ofm_block_identifier/mod.ts";

export interface OfmFromMarkdownOptions {
	blockIdentifier?: OfmBlockIdentifierFromMarkdownOptions;
}

export function ofmFromMarkdown(
	{ blockIdentifier }: OfmFromMarkdownOptions = {},
): Extension[] {
	return [
		...gfmFromMarkdown(),
		mathFromMarkdown(),
		ofmBlockIdentifierFromMarkdown(blockIdentifier),
		ofmCommentFromMarkdown(),
		ofmHighlightFromMarkdown(),
		ofmWikilinkFromMarkdown(),
		ofmCalloutFromMarkdown(),
		ofmImageSize(),
	];
}

export interface OfmToHastHandlersOptions {
	comment?: OfmCommentToHastHandlersOptions;
	callout?: OfmCalloutToHastHandlersOptions;
	blockIdentifier?: OfmBlockIdentifierToHastHandlersOptions;
}

export function ofmToHastHandlers(
	{ comment, callout, blockIdentifier }: OfmToHastHandlersOptions = {},
) {
	return {
		...ofmBlockIdentifierToHastHandlers(blockIdentifier),
		...ofmCalloutToHastHandlers(callout),
		...ofmWikilinkToHastHandlers,
		...ofmCommentToHastHandlers(comment),
	};
}
