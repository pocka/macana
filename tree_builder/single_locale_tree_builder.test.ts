// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertObjectMatch,
} from "../deps/deno.land/std/assert/mod.ts";

import { MemoryFsReader } from "../filesystem_reader/memory_fs.ts";
import { VaultParser } from "../metadata_parser/vault_parser.ts";
import { SingleLocaleTreeBuilder } from "./single_locale_tree_builder.ts";

Deno.test("Should read from top-level directory, as-is", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "Foo Bar/Baz Qux.md", content: "" },
		{ path: "Foo.md", content: "" },
	]);
	const metadataParser = new VaultParser();
	const builder = new SingleLocaleTreeBuilder({ locale: "en" });

	const tree = await builder.build({ fileSystemReader, metadataParser });

	const items = tree.locales.get("en")!;

	assertObjectMatch(items[0], {
		metadata: {
			name: "foo%20bar",
			title: "Foo Bar",
		},
		directory: {
			name: "Foo Bar",
		},
		entries: [
			{
				metadata: {
					name: "baz%20qux",
					title: "Baz Qux",
				},
				file: {
					name: "Baz Qux.md",
				},
			},
		],
	});

	assertObjectMatch(items[1], {
		metadata: {
			name: "foo",
			title: "Foo",
		},
		file: {
			name: "Foo.md",
		},
	});
});

Deno.test("Should ignore files and directories matches to `ignore` callback", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "foo/bar/baz.md", content: "" },
		{ path: "foo/bar.md", content: "" },
		{ path: "foo.md", content: "" },
		{ path: "bar/foo.md", content: "" },
		{ path: "bar/foo/baz.md", content: "" },
	]);
	const metadataParser = new VaultParser();
	const builder = new SingleLocaleTreeBuilder({
		locale: "en",
		ignore(node) {
			return node.name === "foo";
		},
	});

	const tree = await builder.build({ fileSystemReader, metadataParser });

	const items = tree.locales.get("en")!;

	assertEquals(items.length, 2);

	assertObjectMatch(items[0], {
		metadata: {
			name: "foo",
			title: "foo",
		},
		file: { name: "foo.md" },
	});

	assertObjectMatch(items[1], {
		metadata: {
			name: "bar",
			title: "bar",
		},
		directory: {
			name: "bar",
		},
		entries: [
			{
				metadata: {
					name: "foo",
					title: "foo",
				},
				file: {
					name: "foo.md",
				},
			},
		],
	});
});
