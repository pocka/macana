// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertEquals } from "../../deps/deno.land/std/assert/mod.ts";

import { micromark } from "../../deps/npm/micromark/mod.ts";

import { ofmHighlight, ofmHighlightHtml } from "./mod.ts";

function f(markdown: string): string {
	return micromark(markdown, {
		extensions: [ofmHighlight()],
		htmlExtensions: [ofmHighlightHtml()],
	});
}

Deno.test("Should parse basic highlights", () => {
	assertEquals(
		f("==Hello, World!=="),
		"<p><mark>Hello, World!</mark></p>",
	);
});

Deno.test("Should not treat as highlight when no subsequent equal signs", () => {
	assertEquals(
		f("=Hello, World!="),
		"<p>=Hello, World!=</p>",
	);
});

Deno.test("Should not open when the opening sequence is escaped", () => {
	assertEquals(
		f("\\==foo=="),
		"<p>==foo==</p>",
	);
});

Deno.test("Should not treat setext heading symbols as highlight", () => {
	assertEquals(
		f("====="),
		"<p>=====</p>",
	);
});

Deno.test("Should not conflict with setext heading", () => {
	assertEquals(
		f("Foo bar\n======"),
		"<h1>Foo bar</h1>",
	);
});

Deno.test("Should not parse when space exists right after the opening sequence", () => {
	assertEquals(
		f("== Not highlighted =="),
		"<p>== Not highlighted ==</p>",
	);

	assertEquals(
		f("== Me too=="),
		"<p>== Me too==</p>",
	);
});

Deno.test("Should not nest", () => {
	assertEquals(
		f("==Foo==Bar==Baz=="),
		"<p><mark>Foo</mark>Bar<mark>Baz</mark></p>",
	);
});
