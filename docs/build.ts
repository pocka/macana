// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DenoFsReader } from "../filesystem_reader/deno_fs.ts";
import { DenoFsWriter } from "../filesystem_writer/deno_fs.ts";
import {
	DefaultTreeBuilder,
	fileExtensions,
	ignoreDotfiles,
	langDir,
	removeExtFromMetadata,
} from "../tree_builder/default_tree_builder.ts";
import { ObsidianMarkdownParser } from "../content_parser/obsidian_markdown.ts";
import { JSONCanvasParser } from "../content_parser/json_canvas.ts";
import { oneof } from "../content_parser/oneof.ts";
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
	strategies: [
		ignoreDotfiles(),
		fileExtensions([".md", ".canvas"]),
		removeExtFromMetadata(),
		langDir({
			en: "English",
			ja: "日本語",
		}, true),
	],
});
const contentParser = oneof(
	new JSONCanvasParser(),
	new ObsidianMarkdownParser(),
);
const pageBuilder = new DefaultThemeBuilder({
	copyright: "© 2024 Shota FUJI",
	faviconSvg: ["Assets", "logo.svg"],
	faviconPng: ["Assets", "logo-64x64.png"],
});

const documentTree = await treeBuilder.build({
	fileSystemReader,
	contentParser,
});
await pageBuilder.build({
	documentTree,
	fileSystemReader,
	fileSystemWriter,
});
