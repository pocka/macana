// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertExists,
	assertObjectMatch,
} from "../../deps/deno.land/std/assert/mod.ts";

import { DenoFsReader } from "./deno_fs.ts";
import type { DirectoryReader } from "./interface.ts";

Deno.test("Should read file tree", async () => {
	const reader = new DenoFsReader(new URL("../", import.meta.url));

	const root = await reader.getRootDirectory();

	const rootEntries = await root.read();
	assertEquals(rootEntries.length, 1);
	assertObjectMatch(rootEntries[0], {
		type: "directory",
		name: "filesystem_reader",
	});

	const thisDirectory = rootEntries[0] as DirectoryReader;
	const thisDirectoryContents = await thisDirectory.read();

	const thisFile = thisDirectoryContents.find((entry) =>
		entry.name === "deno_fs.test.ts"
	);
	assertExists(thisFile);
	assertEquals(thisFile.type, "file");
	assertEquals(thisFile.name, "deno_fs.test.ts");
	assertEquals(thisFile.path, ["filesystem_reader", "deno_fs.test.ts"]);
	assertEquals(thisFile.parent, thisDirectory);
});
