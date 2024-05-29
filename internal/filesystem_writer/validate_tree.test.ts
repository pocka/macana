// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertExists,
	assertRejects,
} from "../../deps/deno.land/std/assert/mod.ts";

import { MemoryFsWriter } from "./memory_fs.ts";
import { validateTree } from "./validate_tree.ts";

Deno.test("Should prevents from writing file when there is a directory at the path", async () => {
	const writer = validateTree(new MemoryFsWriter());

	const enc = new TextEncoder();

	await writer.write(["foo", "bar.txt"], enc.encode("Foo\n"));

	await assertRejects(async () =>
		await writer.write(["foo"], enc.encode("Bar\n"))
	);
});

Deno.test("Should prevents from writing directory when there is a file at the path", async () => {
	const writer = validateTree(new MemoryFsWriter());

	const enc = new TextEncoder();

	await writer.write(["foo"], enc.encode("Foo\n"));

	await assertRejects(async () =>
		await writer.write(["foo", "bar.txt"], enc.encode("Bar\n"))
	);
});

Deno.test("Should not reject if there is no conflict", async () => {
	const memoryWriter = new MemoryFsWriter();
	const writer = validateTree(memoryWriter);

	const enc = new TextEncoder();

	await writer.write(["foo.txt"], enc.encode("Foo\n"));
	await writer.write(["foo", "bar.txt"], enc.encode("Bar\n"));

	const dec = new TextDecoder();

	const foo = memoryWriter.get(["foo.txt"]);
	assertExists(foo);

	const bar = memoryWriter.get(["foo", "bar.txt"]);
	assertExists(bar);

	assertEquals(dec.decode(foo), "Foo\n");
	assertEquals(dec.decode(bar), "Bar\n");
});
