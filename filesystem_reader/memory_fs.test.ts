// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertObjectMatch,
} from "../deps/deno.land/std/assert/mod.ts";

import { MemoryFsReader } from "./memory_fs.ts";
import type { DirectoryReader, FileReader } from "./interface.ts";

Deno.test("Should create a in-memory file tree", async () => {
	const reader = new MemoryFsReader([
		{
			path: "foo/null",
			content: "",
		},
		{
			path: "foo/bar/baz.txt",
			content: "Foo Bar Baz",
		},
	]);

	const root = await reader.getRootDirectory();

	const rootEntries = await root.read();
	assertEquals(rootEntries.length, 1);

	const foo = rootEntries[0] as DirectoryReader;
	assertObjectMatch(foo, {
		type: "directory",
		name: "foo",
	});

	const fooEntries = await foo.read();
	assertEquals(fooEntries.length, 2);

	const bar = fooEntries[1] as DirectoryReader;
	assertObjectMatch(bar, {
		type: "directory",
		name: "bar",
	});

	const barEntries = await bar.read();
	assertEquals(barEntries.length, 1);

	const baz = barEntries[0] as FileReader;
	assertObjectMatch(baz, {
		type: "file",
		name: "baz.txt",
	});

	const decoder = new TextDecoder();
	const content = await baz.read();
	assertEquals(decoder.decode(content), "Foo Bar Baz");
});
