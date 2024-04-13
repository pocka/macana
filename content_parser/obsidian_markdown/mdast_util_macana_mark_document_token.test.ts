// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assert,
	assertObjectMatch,
} from "../../deps/deno.land/std/assert/mod.ts";

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { fromMarkdown } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";

import { macanaMarkDocumentToken } from "./mdast_util_macana_mark_document_token.ts";

const getDocumentToken = (path: readonly string[]) =>
	`mxt_${path.join("/")}` as const;

Deno.test("Should set Document Token on link", async () => {
	const mdast = fromMarkdown("[Foo](./foo.md)");

	await macanaMarkDocumentToken(mdast, getDocumentToken);

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "link",
						data: {
							macanaDocumentToken: "mxt_./foo.md",
						},
					},
				],
			},
		],
	});
});

Deno.test("Should support absolute path", async () => {
	const mdast = fromMarkdown("[Foo](/foo.md)");

	await macanaMarkDocumentToken(mdast, getDocumentToken);

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "link",
						data: {
							macanaDocumentToken: "mxt_/foo.md",
						},
					},
				],
			},
		],
	});
});

Deno.test("Should skip full image URL", async () => {
	const mdast = fromMarkdown("[Foo](https://example.com/foo.md)");

	await macanaMarkDocumentToken(mdast, getDocumentToken);

	assert(!((mdast.children[0] as Mdast.Paragraph).children[0].data));
});
