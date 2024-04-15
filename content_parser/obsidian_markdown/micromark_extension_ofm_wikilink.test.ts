// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertEquals } from "../../deps/deno.land/std/assert/mod.ts";

import { micromark } from "../../deps/esm.sh/micromark/mod.ts";

import {
	ofmWikilink,
	ofmWikilinkHtml,
} from "./micromark_extension_ofm_wikilink.ts";

function f(markdown: string): string {
	return micromark(markdown, {
		extensions: [ofmWikilink()],
		htmlExtensions: [ofmWikilinkHtml()],
	});
}

Deno.test("Should parse target-only wikilink", () => {
	assertEquals(
		f("[[Hello, World!]]"),
		`<p><a href="Hello, World!">Hello, World!</a></p>`,
	);
});

Deno.test("Should parse labelled wikilink", () => {
	assertEquals(
		f("[[hello|Hello, World!]]"),
		`<p><a href="hello">Hello, World!</a></p>`,
	);
});

Deno.test("Should not start if escaped", () => {
	assertEquals(
		f("\\[[Hello, World!]]"),
		`<p>[[Hello, World!]]</p>`,
	);
});

Deno.test("Should not handle more than two angles", () => {
	assertEquals(
		f("[[[Hello, World!]]"),
		`<p>[<a href="Hello, World!">Hello, World!</a></p>`,
	);
});

Deno.test("Should parse embedding wikilink", () => {
	assertEquals(
		f("![[Hello, World!]]"),
		`<p><iframe src="Hello, World!"></iframe></p>`,
	);
});

Deno.test("Should parse image embedding", () => {
	assertEquals(
		f("![[hello.webp]]"),
		`<p><img src="hello.webp"></p>`,
	);
});

Deno.test("Should parse audio embedding", () => {
	assertEquals(
		f("![[foo.flac]]"),
		`<p><audio src="foo.flac"></audio></p>`,
	);
});

Deno.test("Should parse video embedding", () => {
	assertEquals(
		f("![[bar.webm]]"),
		`<p><video src="bar.webm"></video></p>`,
	);
});
