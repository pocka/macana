// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertEquals } from "../deps/deno.land/std/assert/mod.ts";

import { DenoFsWriter } from "./deno_fs.ts";

const root = new URL("./.test/", import.meta.url);

const writePermission = await Deno.permissions.query({
	name: "write",
	path: root,
});

// Read permission is also required in order to check the output file.
const readPermission = await Deno.permissions.query({
	name: "read",
	path: root,
});

Deno.test("Should write a file", {
	// Skip this test if write permission is not granted.
	// Without this, simple `deno test` would fail or prompt permissions, which is annoying.
	ignore: writePermission.state !== "granted" ||
		readPermission.state !== "granted",
}, async () => {
	await Deno.mkdir(root, { recursive: true });

	try {
		const writer = new DenoFsWriter(root);

		const content = new TextEncoder().encode("Hello, World!\n");

		await writer.write(["foo", "bar.txt"], content);

		assertEquals(
			await Deno.readTextFile(new URL("foo/bar.txt", root)),
			"Hello, World!\n",
		);
	} finally {
		await Deno.remove(root, { recursive: true });
	}
});
