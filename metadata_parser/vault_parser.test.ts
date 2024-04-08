// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../deps/deno.land/std/assert/mod.ts";

import { MemoryFsReader } from "../filesystem_reader/memory_fs.ts";
import { VaultParser } from "./vault_parser.ts";
import type { DirectoryReader } from "../types.ts";

Deno.test("Should use filename as title", async () => {
	const fs = new MemoryFsReader([
		{
			path: "foo.md",
			content: "",
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(await new VaultParser().parse(file), {
		name: "foo",
		title: "foo",
	});
});

Deno.test("Should use directory name as title", async () => {
	const fs = new MemoryFsReader([
		{
			path: "bar/foo.md",
			content: "",
		},
	]);

	const root = await fs.getRootDirectory();
	const [dir] = await root.read();

	assertObjectMatch(await new VaultParser().parse(dir), {
		name: "bar",
		title: "bar",
	});
});

Deno.test("Should parse canvas file", async () => {
	const fs = new MemoryFsReader([
		{
			path: "foo.canvas",
			content: "",
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(await new VaultParser().parse(file), {
		name: "foo",
		title: "foo",
	});
});

Deno.test("Should skip files other than note and canvas", async () => {
	const fs = new MemoryFsReader([
		{
			path: "main.tsx",
			content: "",
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(await new VaultParser().parse(file), { skip: true });
});

Deno.test("Should use name defined in YAML frontmatter", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Foo Bar.md",
			content: `---
name: foo-bar
---`,
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(
		await new VaultParser({ readFrontMatter: true }).parse(file),
		{
			name: "foo-bar",
			title: "Foo Bar",
		},
	);
});

Deno.test("Should use title defined in YAML frontmatter", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Foo Bar.md",
			content: `---
title: Baz
---`,
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(
		await new VaultParser({ readFrontMatter: true }).parse(file),
		{
			name: "Foo Bar",
			title: "Baz",
		},
	);
});

Deno.test("Should use language defined in YAML frontmatter", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Foo Bar.md",
			content: `---
lang: en
---`,
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(
		await new VaultParser({ readFrontMatter: true }).parse(file),
		{
			name: "Foo Bar",
			title: "Foo Bar",
			language: "en",
		},
	);
});

Deno.test("Should use both name and title defined in YAML frontmatter", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Foo Bar.md",
			content: `---
name: foo-bar
title: Baz
---`,
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(
		await new VaultParser({ readFrontMatter: true }).parse(file),
		{
			name: "foo-bar",
			title: "Baz",
		},
	);
});

Deno.test("Should not read frontmatter if the flag is not on", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Foo Bar.md",
			content: `---
name: foo-bar
title: Baz
---`,
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(
		await new VaultParser().parse(file),
		{
			name: "Foo Bar",
			title: "Foo Bar",
		},
	);
});

Deno.test("Should overrides", async () => {
	const fs = new MemoryFsReader([
		{
			path: "en/Foo Bar.md",
			content: "",
		},
		{
			path: "ja/Foo Bar.md",
			content: "",
		},
	]);

	const root = await fs.getRootDirectory();
	const [en, ja] = await root.read();

	const parser = new VaultParser({
		override(node) {
			if (node.type !== "directory" || !(/^(en|ja)$/.test(node.name))) {
				return null;
			}

			return {
				title: node.name === "ja" ? "日本語" : "English",
				language: node.name,
			};
		},
	});

	assertObjectMatch(
		await parser.parse(en as DirectoryReader),
		{
			name: "en",
			title: "English",
			language: "en",
		},
	);

	assertObjectMatch(
		await parser.parse(ja),
		{
			name: "ja",
			title: "日本語",
			language: "ja",
		},
	);
});
