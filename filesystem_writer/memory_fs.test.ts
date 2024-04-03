// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertExists,
} from "../deps/deno.land/std/assert/mod.ts";

import { MemoryFsWriter } from "./memory_fs.ts";

Deno.test("Should write to an internal key-value store", async () => {
	const writer = new MemoryFsWriter();

	const content = new TextEncoder().encode("Hello, World!\n");

	await writer.write(["foo", "bar.txt"], content);

	const wrote = writer.get(["foo", "bar.txt"]);
	assertExists(wrote);

	assertEquals(
		new TextDecoder().decode(wrote),
		"Hello, World!\n",
	);
});
