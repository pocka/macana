// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../deps/deno.land/std/assert/mod.ts";

import { fromMarkdown } from "../../deps/npm/mdast-util-from-markdown/mod.ts";

import { ofmBlockIdentifierFromMarkdown } from "./mod.ts";
import { ofmBlockIdentifier } from "../micromark_extension_ofm_block_identifier/mod.ts";

Deno.test("Should hoist ID", () => {
	const mdast = fromMarkdown("Foo Bar ^Baz", {
		extensions: [ofmBlockIdentifier()],
		mdastExtensions: [ofmBlockIdentifierFromMarkdown({ hoist: true })],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				data: {
					hProperties: {
						id: "Baz",
					},
				},
				children: [
					{
						type: "text",
						value: "Foo Bar ",
					},
				],
			},
		],
	});
});
