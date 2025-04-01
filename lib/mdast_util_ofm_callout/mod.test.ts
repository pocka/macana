// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../deps/deno.land/std/assert/mod.ts";

import { fromMarkdown } from "../../deps/npm/mdast-util-from-markdown/mod.ts";

import { ofmCalloutFromMarkdown } from "./mod.ts";

Deno.test("Should parse callout", () => {
	const mdast = fromMarkdown(`> [!info]\n> Block **content**`, {
		mdastExtensions: [ofmCalloutFromMarkdown()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "ofmCallout",
				calloutType: "info",
				isFoldable: false,
				children: [
					{
						type: "paragraph",
						children: [
							{
								type: "text",
								value: "Block ",
							},
							{
								type: "strong",
								children: [
									{
										type: "text",
										value: "content",
									},
								],
							},
						],
					},
				],
			},
		],
	});
});

Deno.test("Should parse foldable callout", () => {
	const mdast = fromMarkdown(`> [!danger]-\n> Foo`, {
		mdastExtensions: [ofmCalloutFromMarkdown()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "ofmCallout",
				calloutType: "danger",
				isFoldable: true,
				defaultExpanded: false,
				children: [
					{
						type: "paragraph",
						children: [
							{
								type: "text",
								value: "Foo",
							},
						],
					},
				],
			},
		],
	});
});

Deno.test("Should parse default expanded callout", () => {
	const mdast = fromMarkdown(`> [!oops]+\n> Foo`, {
		mdastExtensions: [ofmCalloutFromMarkdown()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "ofmCallout",
				calloutType: "oops",
				isFoldable: true,
				defaultExpanded: true,
				children: [
					{
						type: "paragraph",
						children: [
							{
								type: "text",
								value: "Foo",
							},
						],
					},
				],
			},
		],
	});
});

Deno.test("Should parse title", () => {
	const mdast = fromMarkdown(`> [!todo]- [Foo](https://example.com)\n> Foo`, {
		mdastExtensions: [ofmCalloutFromMarkdown()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "ofmCallout",
				calloutType: "todo",
				isFoldable: true,
				defaultExpanded: false,
				children: [
					{
						type: "ofmCalloutTitle",
						children: [
							{
								type: "link",
								url: "https://example.com",
								children: [
									{
										type: "text",
										value: "Foo",
									},
								],
							},
						],
					},
					{
						type: "paragraph",
						children: [
							{
								type: "text",
								value: "Foo",
							},
						],
					},
				],
			},
		],
	});
});

Deno.test("Should not touch non-callout blockquotes", () => {
	const mdast = fromMarkdown(`> info\n> Block **content**`, {
		mdastExtensions: [ofmCalloutFromMarkdown()],
	});

	assertObjectMatch(mdast, {
		type: "root",
		children: [
			{
				type: "blockquote",
			},
		],
	});
});
