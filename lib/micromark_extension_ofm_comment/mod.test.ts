// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertEquals } from "../../deps/deno.land/std/assert/mod.ts";

import { micromark } from "../../deps/esm.sh/micromark/mod.ts";

import {
	ofmComment,
	ofmCommentHtml,
	type OfmCommentHtmlOptions,
} from "./mod.ts";

function f(markdown: string, opts?: OfmCommentHtmlOptions): string {
	return micromark(markdown, {
		extensions: [ofmComment()],
		htmlExtensions: [ofmCommentHtml(opts)],
	});
}

Deno.test("Should parse inline comment", () => {
	assertEquals(
		f("This is an %%inline%% comment."),
		`<p>This is an  comment.</p>`,
	);
});

Deno.test("Should not treat non-terminated inline comment", () => {
	assertEquals(
		f("This is an %%inline comment."),
		`<p>This is an %%inline comment.</p>`,
	);
});

Deno.test("Should abort if it finds line-endings inside inline comment", () => {
	assertEquals(
		f("This is an %%inline\n comment.%%"),
		`<p>This is an %%inline\ncomment.%%</p>`,
	);
});

Deno.test("Should keep as HTML comment", () => {
	assertEquals(
		f("This is an %%inline%% comment.", {
			preserveAsHtmlComment: true,
		}),
		`<p>This is an <!--inline--> comment.</p>`,
	);
});

Deno.test("Should ignore non-sequential percent sign", () => {
	assertEquals(
		f("This is an %%%inline%% comment.", {
			preserveAsHtmlComment: true,
		}),
		`<p>This is an <!--%inline--> comment.</p>`,
	);
});

Deno.test("Should handle escape", () => {
	assertEquals(
		f("This is an \\%%inline%% comment%%.", {
			preserveAsHtmlComment: true,
		}),
		`<p>This is an %%inline<!-- comment-->.</p>`,
	);
});

Deno.test("Should parse block comment", () => {
	const code = `
%%
This is a block comment.

Block comments can span multiple lines.
%%
	`.trim();
	assertEquals(
		f(code, { preserveAsHtmlComment: true }),
		`<!--
This is a block comment.

Block comments can span multiple lines.
-->`,
	);
});

Deno.test("Should not parse contents inside block comment", () => {
	const code = `
%%
**This is a block comment**.

Block comments can span multiple lines.
%%
	`.trim();
	assertEquals(
		f(code, { preserveAsHtmlComment: true }),
		`<!--
**This is a block comment**.

Block comments can span multiple lines.
-->`,
	);
});

Deno.test("Should parse block comment in a document", () => {
	const code = `
This is a paragraph.

%%
This is a block comment.

Block comments can span multiple lines.
%%

This is a paragraph too.
	`.trim();
	assertEquals(
		f(code, { preserveAsHtmlComment: true }),
		`<p>This is a paragraph.</p>
<!--
This is a block comment.

Block comments can span multiple lines.
-->
<p>This is a paragraph too.</p>`,
	);
});
