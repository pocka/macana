// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../deps/deno.land/std/assert/mod.ts";

import { fromMarkdown } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";

import { macanaMarkAssets } from "./mdast_util_macana_mark_assets.ts";
import { macanaReplaceAssetTokens } from "./mdast_util_macana_replace_asset_tokens.ts";

Deno.test("Should replace Asset Token on images", async () => {
	const mdast = fromMarkdown("![Foo](./foo.png)");

	await macanaMarkAssets(mdast, () => {
		return "mxa_0";
	});

	await macanaReplaceAssetTokens(mdast, (token) => {
		if (token !== "mxa_0") {
			throw new Error("Unexpected token");
		}

		return "../FOO.PNG";
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "image",
						alt: "Foo",
						url: "../FOO.PNG",
					},
				],
			},
		],
	});
});
