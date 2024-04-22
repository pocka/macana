// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	combineExtensions,
	combineHtmlExtensions,
} from "../../deps/esm.sh/micromark-util-combine-extensions/mod.ts";
import {
	gfm,
	gfmHtml,
	type HtmlOptions,
} from "../../deps/esm.sh/micromark-extension-gfm/mod.ts";

import {
	ofmComment,
	ofmCommentHtml,
} from "./micromark_extension_ofm_comment.ts";
import {
	ofmWikilink,
	ofmWikilinkHtml,
} from "./micromark_extension_ofm_wikilink.ts";
import {
	ofmHighlight,
	ofmHighlightHtml,
} from "./micromark_extension_ofm_highlight.ts";

import type {
	Extension,
	HtmlExtension,
} from "../../deps/esm.sh/micromark-util-types/types.ts";

export function ofm(): Extension {
	return combineExtensions([
		ofmComment(),
		ofmWikilink(),
		ofmHighlight(),
		gfm(),
	]);
}

export interface OfmHtmlOptions extends HtmlOptions {
	/**
	 * Whether to preserve comments as HTML comments (`<!-- -->`).
	 */
	preserveComment?: boolean;
}

export function ofmHtml(
	{ preserveComment = false, ...rest }: OfmHtmlOptions = {},
): HtmlExtension {
	return combineHtmlExtensions([
		ofmCommentHtml({ preserveAsHtmlComment: preserveComment }),
		ofmHighlightHtml(),
		ofmWikilinkHtml(),
		gfmHtml(rest),
	]);
}