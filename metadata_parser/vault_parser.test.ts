// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../deps/deno.land/std/assert/mod.ts";

import type { DirectoryReader } from "../filesystem_reader/interface.ts";
import { MemoryFsReader } from "../filesystem_reader/memory_fs.ts";
import { VaultParser } from "./vault_parser.ts";

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

Deno.test("Should lowercase filename for name", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Foo.md",
			content: "",
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(await new VaultParser().parse(file), {
		name: "foo",
		title: "Foo",
	});
});

Deno.test("Should encode to URI-safe name", async () => {
	const fs = new MemoryFsReader([
		{
			path: "My Awesome Document, Progress 75%.md",
			content: "",
		},
	]);

	const root = await fs.getRootDirectory();
	const [file] = await root.read();

	assertObjectMatch(await new VaultParser().parse(file), {
		name: "my%20awesome%20document%2C%20progress%2075%25",
		title: "My Awesome Document, Progress 75%",
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
			name: "foo%20bar",
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
			name: "foo%20bar",
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
			name: "foo%20bar",
			title: "Foo Bar",
		},
	);
});

Deno.test("Should use the language returned by user provided function", async () => {
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
		language(node) {
			return node.type === "directory" && node.path.length === 1 &&
				/^(en|ja)$/.test(node.name);
		},
	});

	assertObjectMatch(
		await parser.parse(en as DirectoryReader),
		{
			name: "en",
			title: "en",
			language: "en",
		},
	);

	assertObjectMatch(
		await parser.parse(ja),
		{
			name: "ja",
			title: "ja",
			language: "ja",
		},
	);
});
