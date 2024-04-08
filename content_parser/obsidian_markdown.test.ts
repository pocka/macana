// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { assertObjectMatch } from "../deps/deno.land/std/assert/mod.ts";

import { VaultParser } from "../metadata_parser/vault_parser.ts";
import { MemoryFsReader } from "../filesystem_reader/memory_fs.ts";
import { ObsidianMarkdownParser } from "./obsidian_markdown.ts";
import type { DocumentMetadata, FileReader } from "../types.ts";

const metadataParser = new VaultParser();

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
	const documentMetadata =
		(await metadataParser.parse(fileReader)) as DocumentMetadata;

	const parser = new ObsidianMarkdownParser();

	const content = await parser.parse({ documentMetadata, fileReader });

	assertObjectMatch(content.content, {
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
	});
});
