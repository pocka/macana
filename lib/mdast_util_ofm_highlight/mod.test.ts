// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../deps/deno.land/std/assert/mod.ts";

import { fromMarkdown } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";

import { ofmHighlight } from "../micromark_extension_ofm_highlight/mod.ts";
import { ofmHighlightFromMarkdown } from "./mod.ts";

Deno.test("Should parse highlights markdown into Mdast node", () => {
	const mdast = fromMarkdown("==Hello, World!==", {
		extensions: [ofmHighlight()],
		mdastExtensions: [ofmHighlightFromMarkdown()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "ofmHighlight",
						children: [
							{
								type: "text",
								value: "Hello, World!",
							},
						],
					},
				],
			},
		],
	});
});
