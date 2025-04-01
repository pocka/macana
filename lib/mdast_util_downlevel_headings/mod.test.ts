// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertObjectMatch,
	assertThrows,
} from "../../deps/deno.land/std/assert/mod.ts";

import { fromMarkdown } from "../../deps/npm/mdast-util-from-markdown/mod.ts";
import { toHast } from "../../deps/npm/mdast-util-to-hast/mod.ts";

import { downlevelHeadingsFromMarkdown } from "./mod.ts";

Deno.test("Should down-level headings", () => {
	const hast = toHast(fromMarkdown(
		`
# Foo
## Bar
### Baz
	`.trim(),
		{
			mdastExtensions: [downlevelHeadingsFromMarkdown()],
		},
	));

	assertObjectMatch(hast, {
		type: "root",
		children: [
			{
				type: "element",
				tagName: "h2",
			},
			{},
			{
				type: "element",
				tagName: "h3",
			},
			{},
			{
				type: "element",
				tagName: "h4",
			},
		],
	});
});

Deno.test("Should down-level headings by given magnitude", () => {
	const hast = toHast(fromMarkdown(
		`
# Foo
## Bar
### Baz
	`.trim(),
		{
			mdastExtensions: [downlevelHeadingsFromMarkdown({ magnitude: 3 })],
		},
	));

	assertObjectMatch(hast, {
		type: "root",
		children: [
			{
				type: "element",
				tagName: "h4",
			},
			{},
			{
				type: "element",
				tagName: "h5",
			},
			{},
			{
				type: "element",
				tagName: "h6",
			},
		],
	});
});

Deno.test("Should throw an error if modified level exceeds 6", () => {
	assertThrows(() => {
		fromMarkdown(
			`
# Foo
## Bar
### Baz
	`.trim(),
			{
				mdastExtensions: [downlevelHeadingsFromMarkdown({ magnitude: 4 })],
			},
		);
	});
});
