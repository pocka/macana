// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../deps/deno.land/std/assert/mod.ts";

import { fromMarkdown } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";

import { macanaMarkDocumentToken } from "./mdast_util_macana_mark_document_token.ts";
import { macanaReplaceDocumentToken } from "./mdast_util_macana_replace_document_tokens.ts";

Deno.test("Should replace Document Token on links", async () => {
	const mdast = fromMarkdown("[Foo](./foo.png)");

	await macanaMarkDocumentToken(mdast, () => {
		return "mxt_0";
	});

	await macanaReplaceDocumentToken(mdast, (token) => {
		if (token !== "mxt_0") {
			throw new Error("Unexpected token");
		}

		return {
			path: "../FOO.MD",
		};
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "link",
						url: "../FOO.MD",
					},
				],
			},
		],
	});
});
