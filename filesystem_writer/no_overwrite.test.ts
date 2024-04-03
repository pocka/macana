// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertExists,
	assertRejects,
} from "../deps/deno.land/std/assert/mod.ts";

import { MemoryFsWriter } from "./memory_fs.ts";
import { noOverwrite } from "./no_overwrite.ts";

Deno.test("Should prevent write to different contents to same path", async () => {
	const writer = noOverwrite(new MemoryFsWriter());

	const enc = new TextEncoder();

	await writer.write(["foo", "bar", "baz"], enc.encode("Foo Bar Baz\n"));

	await assertRejects(async () =>
		// No final newline
		await writer.write(["foo", "bar", "baz"], enc.encode("Foo Bar Baz"))
	);
});

Deno.test("Should not reject if the contents are same", async () => {
	const memoryWriter = new MemoryFsWriter();
	const writer = noOverwrite(memoryWriter);

	const enc = new TextEncoder();

	await writer.write(["foo", "bar", "baz"], enc.encode("Foo Bar Baz\n"));
	await writer.write(["foo", "bar", "baz"], enc.encode("Foo Bar Baz\n"));

	const file = memoryWriter.get(["foo", "bar", "baz"]);
	assertExists(file);
	assertEquals(new TextDecoder().decode(file), "Foo Bar Baz\n");
});

Deno.test("Should not reject if paths are different", async () => {
	const memoryWriter = new MemoryFsWriter();
	const writer = noOverwrite(memoryWriter);

	const enc = new TextEncoder();

	await writer.write(["foo", "bar", "baz"], enc.encode("Foo Bar Baz\n"));
	await writer.write(["foo", "bar", "qux"], enc.encode("Foo Bar Qux\n"));

	const baz = memoryWriter.get(["foo", "bar", "baz"]);
	assertExists(baz);
	assertEquals(new TextDecoder().decode(baz), "Foo Bar Baz\n");

	const qux = memoryWriter.get(["foo", "bar", "qux"]);
	assertExists(qux);
	assertEquals(new TextDecoder().decode(qux), "Foo Bar Qux\n");
});
