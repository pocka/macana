// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assert,
	assertObjectMatch,
} from "../../../deps/deno.land/std/assert/mod.ts";

import type * as Mdast from "../../../deps/npm/mdast/types.ts";
import { fromMarkdown } from "../../../deps/npm/mdast-util-from-markdown/mod.ts";

import { macanaMarkDocumentToken } from "./mdast_util_macana_mark_document_token.ts";
import { ofmWikilinkFromMarkdown } from "../../../lib/mdast_util_ofm_wikilink/mod.ts";
import { ofmWikilink } from "../../../lib/micromark_extension_ofm_wikilink/mod.ts";

const getDocumentToken = (
	path: readonly string[],
	fragments: readonly string[],
) => `mxt_${path.join("/")}${fragments.map((s) => "&" + s).join("")}` as const;

function toMdast(markdown: string) {
	return fromMarkdown(markdown, {
		extensions: [ofmWikilink()],
		mdastExtensions: [ofmWikilinkFromMarkdown()],
	});
}

Deno.test("Should set Document Token on link", async () => {
	const mdast = toMdast("[Foo](./foo.md)");

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
	const mdast = toMdast("[Foo](/foo.md)");

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

Deno.test("Should skip full URL", async () => {
	const mdast = toMdast("[Foo](https://example.com/foo.md)");

	await macanaMarkDocumentToken(mdast, getDocumentToken);

	assert(!((mdast.children[0] as Mdast.Paragraph).children[0].data));
});

Deno.test("Should set Document Token on wikilink", async () => {
	const mdast = toMdast("[[Foo]]");

	await macanaMarkDocumentToken(mdast, getDocumentToken);

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "ofmWikilink",
						data: {
							macanaDocumentToken: "mxt_Foo",
						},
					},
				],
			},
		],
	});
});

Deno.test("Should parse hash part", async () => {
	const mdast = toMdast("[[My note#Heading 1#Heading 2]]");

	await macanaMarkDocumentToken(mdast, getDocumentToken);

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "ofmWikilink",
						data: {
							macanaDocumentToken: "mxt_My note&Heading 1&Heading 2",
						},
					},
				],
			},
		],
	});
});
