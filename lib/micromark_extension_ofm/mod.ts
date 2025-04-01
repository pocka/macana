// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	combineExtensions,
	combineHtmlExtensions,
} from "../../deps/npm/micromark-util-combine-extensions/mod.ts";
import {
	gfm,
	gfmHtml,
	type HtmlOptions,
} from "../../deps/npm/micromark-extension-gfm/mod.ts";
import { math, mathHtml } from "../../deps/npm/micromark-extension-math/mod.ts";

import {
	ofmBlockIdentifier,
	ofmBlockIdentifierHtml,
} from "../micromark_extension_ofm_block_identifier/mod.ts";
import {
	ofmComment,
	ofmCommentHtml,
} from "../micromark_extension_ofm_comment/mod.ts";
import {
	ofmWikilink,
	ofmWikilinkHtml,
} from "../micromark_extension_ofm_wikilink/mod.ts";
import {
	ofmHighlight,
	ofmHighlightHtml,
} from "../micromark_extension_ofm_highlight/mod.ts";

import type {
	Extension,
	HtmlExtension,
} from "../../deps/npm/micromark-util-types/types.ts";

export function ofm(): Extension {
	return combineExtensions([
		ofmBlockIdentifier(),
		ofmComment(),
		ofmWikilink(),
		ofmHighlight(),
		gfm(),
		math(),
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
		ofmBlockIdentifierHtml(),
		ofmCommentHtml({ preserveAsHtmlComment: preserveComment }),
		ofmHighlightHtml(),
		ofmWikilinkHtml(),
		gfmHtml(rest),
		mathHtml(),
	]);
}
