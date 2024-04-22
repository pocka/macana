// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../deps/deno.land/std/assert/mod.ts";

import { fromMarkdown } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import { toHast } from "../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { ofmWikilink } from "./micromark_extension_ofm_wikilink.ts";
import { ofmWikilinkFromMarkdown } from "./mdast_util_ofm_wikilink.ts";

import { ofmImageSize } from "./mdast_util_ofm_image_size.ts";

Deno.test("Should parse full size attribute", () => {
	const mdast = fromMarkdown("![Foo|100x200](./foo.png)", {
		mdastExtensions: [ofmImageSize()],
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
						data: {
							width: 100,
							height: 200,
						},
					},
				],
			},
		],
	});
});

Deno.test("Should parse for wikilink embeds", () => {
	const mdast = fromMarkdown("![[Foo|999x9]]", {
		extensions: [ofmWikilink()],
		mdastExtensions: [ofmWikilinkFromMarkdown(), ofmImageSize()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "ofmWikilinkEmbed",
						data: {
							width: 999,
							height: 9,
						},
					},
				],
			},
		],
	});
});

Deno.test("Should ignore negative sizes", () => {
	const mdast = fromMarkdown("![Foo|-5x-3](./foo.png)", {
		mdastExtensions: [ofmImageSize()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "image",
						alt: "Foo|-5x-3",
					},
				],
			},
		],
	});
});

Deno.test("Should ignore zero as a size", () => {
	const mdast = fromMarkdown("![Foo|100x0](./foo.png)", {
		mdastExtensions: [ofmImageSize()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "image",
						alt: "Foo|100x0",
					},
				],
			},
		],
	});
});

Deno.test("Should parse width-only attribute", () => {
	const mdast = fromMarkdown("![Foo|123](./foo.png)", {
		mdastExtensions: [ofmImageSize()],
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
						data: {
							width: 123,
						},
					},
				],
			},
		],
	});
});

Deno.test("Should work for image reference too", () => {
	const mdast = fromMarkdown("![Foo|999x888][foo]\n\n[foo]: ./foo.png", {
		mdastExtensions: [ofmImageSize()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "imageReference",
						alt: "Foo",
						data: {
							width: 999,
							height: 888,
						},
					},
				],
			},
		],
	});
});

Deno.test("Should set HTML attributes", () => {
	const mdast = fromMarkdown("![Foo|123x456](./foo.png)", {
		mdastExtensions: [ofmImageSize()],
	});

	const hast = toHast(mdast);

	assertObjectMatch(hast, {
		type: "root",
		children: [
			{
				type: "element",
				tagName: "p",
				children: [
					{
						type: "element",
						tagName: "img",
						properties: {
							width: 123,
							height: 456,
							alt: "Foo",
						},
					},
				],
			},
		],
	});
});
