// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { Extension } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import { gfmFromMarkdown } from "../../deps/esm.sh/mdast-util-gfm/mod.ts";

import { ofmCommentFromMarkdown } from "./mdast_util_ofm_comment.ts";
import { ofmHighlightFromMarkdown } from "./mdast_util_ofm_highlight.ts";
import { ofmWikilinkFromMarkdown } from "./mdast_util_ofm_wikilink.ts";
import { ofmCalloutFromMarkdown } from "./mdast_util_ofm_callout.ts";
import { ofmImageSize } from "./mdast_util_ofm_image_size.ts";

export function ofmFromMarkdown(): Extension[] {
	return [
		...gfmFromMarkdown(),
		ofmCommentFromMarkdown(),
		ofmHighlightFromMarkdown(),
		ofmWikilinkFromMarkdown(),
		ofmCalloutFromMarkdown(),
		ofmImageSize(),
	];
}
