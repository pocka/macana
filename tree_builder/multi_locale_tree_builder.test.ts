// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertObjectMatch,
	assertRejects,
} from "../deps/deno.land/std/assert/mod.ts";

import { MemoryFsReader } from "../filesystem_reader/memory_fs.ts";
import { VaultParser } from "../metadata_parser/vault_parser.ts";
import { MultiLocaleTreeBuilder } from "./multi_locale_tree_builder.ts";

Deno.test("Should read top-level directories as locales", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "en/Foo Bar/Baz.md", content: "" },
		{ path: "es/Foo Bar/Baz.md", content: "" },
	]);
	const metadataParser = new VaultParser();
	const builder = new MultiLocaleTreeBuilder();

	const tree = await builder.build({ fileSystemReader, metadataParser });

	assertEquals(tree.defaultLocale, "en");
	assertObjectMatch(Object.fromEntries(Array.from(tree.locales.entries())), {
		en: [
			{
				metadata: { name: "foo%20bar", title: "Foo Bar" },
				directory: { name: "Foo Bar" },
				entries: [
					{
						metadata: { name: "baz", title: "Baz" },
						file: { name: "Baz.md" },
					},
				],
			},
		],
		es: [
			{
				metadata: { name: "foo%20bar", title: "Foo Bar" },
				directory: { name: "Foo Bar" },
				entries: [
					{
						metadata: { name: "baz", title: "Baz" },
						file: { name: "Baz.md" },
					},
				],
			},
		],
	});
});

Deno.test("Should abort if top-level file exists", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "en/Foo Bar/Baz.md", content: "" },
		{ path: "es/Foo Bar/Baz.md", content: "" },
		{ path: "ja.md", content: "" },
	]);
	const metadataParser = new VaultParser();
	const builder = new MultiLocaleTreeBuilder();

	await assertRejects(() =>
		builder.build({ fileSystemReader, metadataParser })
	);
});

Deno.test("Should abort if locale directory's name was not valid language tag", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "en_US/Foo Bar/Baz.md", content: "" },
		{ path: "es/Foo Bar/Baz.md", content: "" },
	]);
	const metadataParser = new VaultParser();
	const builder = new MultiLocaleTreeBuilder();

	await assertRejects(() =>
		builder.build({ fileSystemReader, metadataParser })
	);
});

Deno.test("Should abort if defaultLocale uses non-existent locale", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "en/Foo Bar/Baz.md", content: "" },
		{ path: "es/Foo Bar/Baz.md", content: "" },
	]);
	const metadataParser = new VaultParser();
	const builder = new MultiLocaleTreeBuilder({ defaultLocale: "ja" });

	await assertRejects(() =>
		builder.build({ fileSystemReader, metadataParser })
	);
});

Deno.test("Should abort no locale directory found", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "en/Foo Bar/Baz.md", content: "" },
		{ path: "es/Foo Bar/Baz.md", content: "" },
	]);
	const metadataParser = new VaultParser();
	const builder = new MultiLocaleTreeBuilder({
		ignore() {
			return true;
		},
	});

	await assertRejects(() =>
		builder.build({ fileSystemReader, metadataParser })
	);
});

Deno.test("Should abort if name conflicts", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "en/Foo Bar/Baz.md", content: "" },
		{ path: "en/Foo Bar.md", content: "" },
	]);
	const metadataParser = new VaultParser();
	const builder = new MultiLocaleTreeBuilder();

	await assertRejects(() =>
		builder.build({ fileSystemReader, metadataParser })
	);
});
