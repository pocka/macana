// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertThrows } from "../deps/deno.land/std/assert/mod.ts";

import { assertDocumentTreeIsValid } from "./assert.ts";

Deno.test("Should throws if locale uses invalid lang subtag format", () => {
	assertThrows(() => {
		assertDocumentTreeIsValid({
			defaultLocale: "en",
			locales: new Map([
				["en", []],
				["ja_JP", []],
			]),
		});
	});
});
