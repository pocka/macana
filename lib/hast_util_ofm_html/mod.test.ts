// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../deps/deno.land/std/assert/mod.ts";

import { ofmHtml } from "./mod.ts";

Deno.test("Should strip <style>", () => {
	assertObjectMatch(
		ofmHtml({
			type: "root",
			children: [
				{
					type: "element",
					tagName: "style",
					properties: {},
					children: [
						{
							type: "text",
							value: "body{display:none;}",
						},
					],
				},
				{
					type: "text",
					value: "Foo",
				},
			],
		}),
		{
			type: "root",
			children: [
				{
					type: "text",
					value: "Foo",
				},
			],
		},
	);
});

Deno.test("Should strip <script>", () => {
	assertObjectMatch(
		ofmHtml({
			type: "root",
			children: [
				{
					type: "element",
					tagName: "script",
					properties: {},
					children: [
						{
							type: "text",
							value: "alert('yay')",
						},
					],
				},
				{
					type: "text",
					value: "Foo",
				},
			],
		}),
		{
			type: "root",
			children: [
				{
					type: "text",
					value: "Foo",
				},
			],
		},
	);
});

Deno.test("Should strip <title>", () => {
	assertObjectMatch(
		ofmHtml({
			type: "root",
			children: [
				{
					type: "element",
					tagName: "title",
					properties: {},
					children: [
						{
							type: "text",
							value: "404",
						},
					],
				},
				{
					type: "text",
					value: "Foo",
				},
			],
		}),
		{
			type: "root",
			children: [
				{
					type: "text",
					value: "Foo",
				},
			],
		},
	);
});

Deno.test("Should strip hidden inside another tag", () => {
	assertObjectMatch(
		ofmHtml({
			type: "root",
			children: [
				{
					type: "element",
					tagName: "div",
					properties: {},
					children: [
						{
							type: "element",
							tagName: "script",
							properties: {},
							children: [
								{
									type: "text",
									value: "alert('yay')",
								},
							],
						},
						{
							type: "text",
							value: "Foo",
						},
					],
				},
			],
		}),
		{
			type: "root",
			children: [
				{
					type: "element",
					tagName: "div",
					properties: {},
					children: [
						{
							type: "text",
							value: "Foo",
						},
					],
				},
			],
		},
	);
});
