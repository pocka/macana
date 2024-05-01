// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertObjectMatch,
} from "../deps/deno.land/std/assert/mod.ts";

import { MemoryFsReader } from "../filesystem_reader/memory_fs.ts";
import { ObsidianMarkdownParser } from "./obsidian_markdown.ts";
import type { AssetToken, DocumentToken, FileReader } from "../types.ts";

function getAssetToken(path: readonly string[]): AssetToken {
	return `mxa_${path.join(".")}`;
}

function getDocumentToken(path: readonly string[]): DocumentToken {
	return `mxt_${path.join(".")}`;
}

Deno.test("Should parse CommonMark syntax", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Test.md",
			content: `
# H1
## H2
### H3
			`,
		},
	]);

	const fileReader =
		(await (fs.getRootDirectory().then((dir) => dir.read()).then((entries) =>
			entries[0]
		))) as FileReader;

	const parser = new ObsidianMarkdownParser();

	const content = await parser.parse({
		documentMetadata: {
			title: "Test",
			name: "Test",
		},
		fileReader,
		getAssetToken,
		getDocumentToken,
	});

	assertObjectMatch(
		"documentContent" in content
			? content.documentContent.content
			: content.content,
		{
			type: "root",
			children: [
				{
					type: "heading",
					depth: 1,
				},
				{
					type: "heading",
					depth: 2,
				},
				{
					type: "heading",
					depth: 3,
				},
			],
		},
	);
});

Deno.test("Should parse YAML frontmatter", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Test.md",
			content: `---
title: "Alice's blog post #1"
name: alice-blog-01
lang: en-US
---

# H1
			`,
		},
	]);

	const fileReader =
		(await (fs.getRootDirectory().then((dir) => dir.read()).then((entries) =>
			entries[0]
		))) as FileReader;

	const parser = new ObsidianMarkdownParser({ frontmatter: true });

	const content = await parser.parse({
		documentMetadata: {
			title: "Test",
			name: "Test",
		},
		fileReader,
		getAssetToken,
		getDocumentToken,
	});

	assertObjectMatch(content, {
		documentContent: {
			content: {
				type: "root",
				children: [
					{
						type: "heading",
						depth: 1,
					},
				],
			},
		},
		documentMetadata: {
			title: "Alice's blog post #1",
			name: "alice-blog-01",
			language: "en-US",
		},
	});
});

Deno.test("Should not throw when document has no frontmatter but frontmatter option is enabled", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Test.md",
			content: `
## H2
`,
		},
	]);

	const fileReader =
		(await (fs.getRootDirectory().then((dir) => dir.read()).then((entries) =>
			entries[0]
		))) as FileReader;

	const parser = new ObsidianMarkdownParser({ frontmatter: true });

	const content = await parser.parse({
		documentMetadata: {
			title: "Test",
			name: "Test",
		},
		fileReader,
		getAssetToken,
		getDocumentToken,
	});

	assertObjectMatch(content, {
		content: {
			type: "root",
			children: [
				{
					type: "heading",
					depth: 2,
				},
			],
		},
	});
});

Deno.test("Should not drop metadata when parsing YAML frontmatter", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Test.md",
			content: `---
title: "Alice's blog post #1"
name: alice-blog-01
lang: en-US
---

# H1
			`,
		},
	]);

	const fileReader =
		(await (fs.getRootDirectory().then((dir) => dir.read()).then((entries) =>
			entries[0]
		))) as FileReader;

	const parser = new ObsidianMarkdownParser({ frontmatter: true });

	const content = await parser.parse({
		documentMetadata: {
			title: "Test",
			name: "Test",
			isDefaultDocument: true,
		},
		fileReader,
		getAssetToken,
		getDocumentToken,
	});

	assertObjectMatch(content, {
		documentMetadata: {
			title: "Alice's blog post #1",
			name: "alice-blog-01",
			language: "en-US",
			isDefaultDocument: true,
		},
	});
});

Deno.test("Should resolve nested hash", async () => {
	const fs = new MemoryFsReader([
		{
			path: "Test.md",
			content: `
# H1
## H2
### H3
			`,
		},
	]);

	const fileReader =
		(await (fs.getRootDirectory().then((dir) => dir.read()).then((entries) =>
			entries[0]
		))) as FileReader;

	const parser = new ObsidianMarkdownParser();

	const content = await parser.parse({
		documentMetadata: {
			title: "Test",
			name: "Test",
		},
		fileReader,
		getAssetToken,
		getDocumentToken,
	});
	const c = "documentContent" in content ? content.documentContent : content;

	const hash = c.getHash(["H1", "H2", "H3"]);

	assertEquals(hash, "H3");
});
