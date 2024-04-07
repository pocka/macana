// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DenoFsReader } from "../filesystem_reader/deno_fs.ts";
import { DenoFsWriter } from "../filesystem_writer/deno_fs.ts";
import { DefaultTreeBuilder } from "../tree_builder/default_tree_builder.ts";
import { ObsidianMarkdownParser } from "../content_parser/obsidian_markdown.ts";
import { VaultParser } from "../metadata_parser/vault_parser.ts";
import { DefaultThemeBuilder } from "../page_builder/default_theme/builder.tsx";

const outDir = new URL("./.dist", import.meta.url);

await Deno.permissions.request({
	name: "write",
	path: outDir,
});

const srcDir = new URL(".", import.meta.url);

await Deno.permissions.request({
	name: "read",
	path: srcDir,
});

await Deno.mkdir(outDir, { recursive: true });

const fileSystemReader = new DenoFsReader(srcDir);
const fileSystemWriter = new DenoFsWriter(outDir);
const treeBuilder = new DefaultTreeBuilder({
	defaultLanguage: "en",
	ignore(node) {
		return node.name.startsWith(".") ||
			(node.path.length === 1 && node.name.endsWith(".ts"));
	},
});
const contentParser = new ObsidianMarkdownParser();
const metadataParser = new VaultParser({
	override(node) {
		if (
			node.parent.type !== "root" || node.type !== "directory" ||
			!(/^[a-z]+(-[a-z]+)*$/.test(node.name))
		) {
			return null;
		}

		switch (node.name) {
			case "ja":
				return {
					title: "日本語",
					language: node.name,
				};
			case "en":
				return {
					title: "English",
					language: node.name,
				};
			default: {
				return {
					language: node.name,
				};
			}
		}
	},
});
const pageBuilder = new DefaultThemeBuilder("© 2024 Shota FUJI");

const documentTree = await treeBuilder.build({
	fileSystemReader,
	metadataParser,
	contentParser,
});
await pageBuilder.build({
	documentTree,
	fileSystemReader,
	fileSystemWriter,
});
