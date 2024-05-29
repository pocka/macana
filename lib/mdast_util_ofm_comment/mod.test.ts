// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../deps/deno.land/std/assert/mod.ts";

import { fromMarkdown } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";

import { ofmComment } from "../micromark_extension_ofm_comment/mod.ts";
import { ofmCommentFromMarkdown } from "./mod.ts";

Deno.test("Should convert comment into Mdast", () => {
	const mdast = fromMarkdown("This is an %%inline%% comment.", {
		extensions: [ofmComment()],
		mdastExtensions: [ofmCommentFromMarkdown()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "text",
						value: "This is an ",
					},
					{
						type: "ofmComment",
						children: [
							{
								type: "ofmCommentBody",
								value: "inline",
							},
						],
					},
					{
						type: "text",
						value: " comment.",
					},
				],
			},
		],
	});
});
