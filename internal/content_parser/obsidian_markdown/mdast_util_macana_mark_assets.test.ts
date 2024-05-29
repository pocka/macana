// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assert,
	assertObjectMatch,
} from "../../../deps/deno.land/std/assert/mod.ts";

import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";
import { fromMarkdown } from "../../../deps/esm.sh/mdast-util-from-markdown/mod.ts";

import { macanaMarkAssets } from "./mdast_util_macana_mark_assets.ts";
import { ofmWikilink } from "../../../lib/micromark_extension_ofm_wikilink/mod.ts";
import { ofmWikilinkFromMarkdown } from "../../../lib/mdast_util_ofm_wikilink/mod.ts";

const getAssetToken = (path: readonly string[]) =>
	`mxa_${path.join("/")}` as const;

function toMdast(markdown: string) {
	return fromMarkdown(markdown, {
		extensions: [ofmWikilink()],
		mdastExtensions: [ofmWikilinkFromMarkdown()],
	});
}

Deno.test("Should set Asset Token on image's data", async () => {
	const mdast = toMdast("![Foo](./foo.png)");

	await macanaMarkAssets(mdast, getAssetToken);

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "image",
						alt: "Foo",
						data: {
							macanaAssetToken: "mxa_./foo.png",
						},
					},
				],
			},
		],
	});
});

Deno.test("Should support Vaule root absolute path for image", async () => {
	const mdast = toMdast("![Foo](/foo.png)");

	await macanaMarkAssets(mdast, getAssetToken);

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "image",
						alt: "Foo",
						data: {
							macanaAssetToken: "mxa_/foo.png",
						},
					},
				],
			},
		],
	});
});

Deno.test("Should skip full image URL", async () => {
	const mdast = toMdast("![Foo](https://example.com/image.png)");

	await macanaMarkAssets(mdast, getAssetToken);

	assert(!((mdast.children[0] as Mdast.Paragraph).children[0].data));
});

Deno.test("Should set Asset Token on wikilink embeds too", async () => {
	const mdast = toMdast("![[doge.mp4]]");

	await macanaMarkAssets(mdast, getAssetToken);

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "ofmWikilinkEmbed",
						data: {
							macanaAssetToken: "mxa_doge.mp4",
						},
					},
				],
			},
		],
	});
});
