// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertExists,
} from "../deps/deno.land/std/assert/mod.ts";

import { DenoFsReader } from "./deno_fs.ts";
import type { DirectoryReader } from "./interface.ts";

Deno.test("Should read file tree", {
	// Skip this test if read permission is not granted.
	// Without this, simple `deno test` would fail or prompt permissions, which is annoying.
	ignore: (await Deno.permissions.query({
		name: "read",
		path: new URL("../", import.meta.url),
	})).state !== "granted",
}, async () => {
	const reader = new DenoFsReader(new URL("../", import.meta.url));

	const root = await reader.getRootDirectory();

	const rootEntries = await root.read();
	const thisDirectory = rootEntries.find((entry) =>
		entry.name === "filesystem_reader"
	) as DirectoryReader;
	assertExists(thisDirectory);
	assertEquals(thisDirectory.type, "directory");
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
