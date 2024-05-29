// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../deps/deno.land/std/assert/mod.ts";

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { fromMarkdown } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import { toHast } from "../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { autoHeadingId, autoHeadingIdFromMarkdown } from "./mod.ts";

Deno.test("Should set ID to heading", () => {
	const hast = toHast(fromMarkdown("# Foo `Bar` Baz", {
		mdastExtensions: [autoHeadingIdFromMarkdown()],
	}));

	assertObjectMatch(hast, {
		type: "root",
		children: [
			{
				type: "element",
				tagName: "h1",
				properties: {
					id: "Foo-Bar-Baz",
				},
			},
		],
	});
});

Deno.test("Should not set ID if there is already one", () => {
	const mdast: Mdast.Root = {
		type: "root",
		children: [
			{
				type: "heading",
				depth: 1,
				data: {
					hProperties: {
						id: "Bar",
					},
				},
				children: [{
					type: "text",
					value: "Foo",
				}],
			},
		],
	};

	autoHeadingId(mdast);

	const hast = toHast(mdast);

	assertObjectMatch(hast, {
		type: "root",
		children: [
			{
				type: "element",
				tagName: "h1",
				properties: {
					id: "Bar",
				},
			},
		],
	});
});

Deno.test("Should avoid setting duplicated ID", () => {
	const hast = toHast(fromMarkdown("# Foo\n## Foo\n### Foo", {
		mdastExtensions: [autoHeadingIdFromMarkdown()],
	}));

	assertObjectMatch(hast, {
		type: "root",
		children: [
			{
				type: "element",
				tagName: "h1",
				properties: {
					id: "Foo",
				},
			},
			{
				type: "text",
			},
			{
				type: "element",
				tagName: "h2",
				properties: {
					id: "Foo__1",
				},
			},
			{
				type: "text",
			},
			{
				type: "element",
				tagName: "h3",
				properties: {
					id: "Foo__2",
				},
			},
		],
	});
});
