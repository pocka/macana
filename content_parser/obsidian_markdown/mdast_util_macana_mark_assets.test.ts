// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assert,
	assertObjectMatch,
} from "../../deps/deno.land/std/assert/mod.ts";

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { fromMarkdown } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";

import { macanaMarkAssets } from "./mdast_util_macana_mark_assets.ts";

const getAssetToken = (path: readonly string[]) =>
	`mxa_${path.join("/")}` as const;

Deno.test("Should set Asset Token on image's data", async () => {
	const mdast = fromMarkdown("![Foo](./foo.png)");

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
	const mdast = fromMarkdown("![Foo](/foo.png)");

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
	const mdast = fromMarkdown("![Foo](https://example.com/image.png)");

	await macanaMarkAssets(mdast, getAssetToken);

	assert(!((mdast.children[0] as Mdast.Paragraph).children[0].data));
});
