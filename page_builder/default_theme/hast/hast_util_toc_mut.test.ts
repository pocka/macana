// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../../../deps/deno.land/std/assert/mod.ts";
import { h } from "../../../deps/esm.sh/hastscript/mod.ts";

import { tocMut } from "./hast_util_toc_mut.ts";

Deno.test("Should build outline tree", () => {
	const toc = tocMut(h(null, [
		h("h1", []),
		h("h2", []),
		h("h3", []),
		h("h4", []),
		h("h5", []),
		h("h6", []),
		h("h2", []),
		h("h3", []),
		h("h4", []),
		h("h5", []),
		h("h6", []),
		h("h3", []),
		h("h4", []),
		h("h5", []),
		h("h6", []),
		h("h4", []),
		h("h5", []),
		h("h6", []),
		h("h5", []),
		h("h6", []),
		h("h6", []),
		h("h1", []),
	]));

	// @ts-expect-error: Deno ships broken type definition for assert functions
	assertObjectMatch(toc, [
		{
			level: 1,
			children: [
				{
					level: 2,
					children: [
						{
							level: 3,
							children: [
								{
									level: 4,
									children: [
										{
											level: 5,
											children: [
												{ level: 6 },
											],
										},
									],
								},
							],
						},
					],
				},
				{
					level: 2,
					children: [
						{
							level: 3,
							children: [
								{
									level: 4,
									children: [
										{
											level: 5,
											children: [
												{ level: 6 },
											],
										},
									],
								},
							],
						},
						{
							level: 3,
							children: [
								{
									level: 4,
									children: [
										{
											level: 5,
											children: [
												{ level: 6 },
											],
										},
									],
								},
								{
									level: 4,
									children: [
										{
											level: 5,
											children: [
												{ level: 6 },
											],
										},
										{
											level: 5,
											children: [
												{ level: 6 },
												{ level: 6 },
											],
										},
									],
								},
							],
						},
					],
				},
			],
		},
		{
			level: 1,
		},
	]);
});

Deno.test("Should not set duplicate IDs", () => {
	const toc = tocMut(h(null, [
		h("h1", [{ type: "text", value: "Foo" }]),
		h("h1", [{ type: "text", value: "Foo" }]),
	]));

	// @ts-expect-error: Deno ships broken type definition for assert functions
	assertObjectMatch(toc, [
		{
			level: 1,
			id: "Foo",
		},
		{
			level: 1,
			id: "Foo__1",
		},
	]);
});
