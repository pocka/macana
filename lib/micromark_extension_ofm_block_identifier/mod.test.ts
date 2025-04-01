// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertEquals } from "../../deps/deno.land/std/assert/mod.ts";
import { micromark } from "../../deps/npm/micromark/mod.ts";

import { ofmBlockIdentifier, ofmBlockIdentifierHtml } from "./mod.ts";

function f(markdown: string): string {
	return micromark(markdown, {
		extensions: [ofmBlockIdentifier()],
		htmlExtensions: [ofmBlockIdentifierHtml()],
	});
}

Deno.test("Should parse block identifier", () => {
	assertEquals(
		f("Foo Bar ^Baz"),
		`<p>Foo Bar <span id="Baz"></span></p>`,
	);
});

Deno.test("Should abort parse when encountered space", () => {
	assertEquals(
		f("Foo Bar ^Baz Qux"),
		`<p>Foo Bar ^Baz Qux</p>`,
	);
});

Deno.test("Should parse when at the end of block", () => {
	assertEquals(
		f("Foo Bar ^Baz\n\nQux"),
		`<p>Foo Bar <span id="Baz"></span></p>\n<p>Qux</p>`,
	);
});

Deno.test("Should parse even an identifier is at the first on a line", () => {
	assertEquals(
		f("Foo Bar\n^Baz\n\nQux"),
		`<p>Foo Bar\n<span id="Baz"></span></p>\n<p>Qux</p>`,
	);
});
