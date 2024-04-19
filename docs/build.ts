// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as log from "../deps/deno.land/std/log/mod.ts";
import * as cli from "../deps/deno.land/std/cli/mod.ts";

import { DenoFsReader } from "../filesystem_reader/deno_fs.ts";
import { DenoFsWriter } from "../filesystem_writer/deno_fs.ts";
import {
	DefaultTreeBuilder,
	fileExtensions,
	ignoreDotfiles,
	langDir,
	removeExtFromMetadata,
	useFileSystemTimestamps,
} from "../tree_builder/default_tree_builder.ts";
import { ObsidianMarkdownParser } from "../content_parser/obsidian_markdown.ts";
import { JSONCanvasParser } from "../content_parser/json_canvas.ts";
import { oneof } from "../content_parser/oneof.ts";
import { DefaultThemeBuilder } from "../page_builder/default_theme/builder.tsx";

export async function build() {
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
		ignore: [ignoreDotfiles],
		strategies: [
			fileExtensions([".md", ".canvas"]),
			removeExtFromMetadata(),
			useFileSystemTimestamps(),
			langDir({
				en: "English",
				ja: "日本語",
			}, true),
		],
		resolveShortestPathWhenPossible: true,
	});
	const contentParser = oneof(
		new JSONCanvasParser(),
		new ObsidianMarkdownParser(),
	);
	const pageBuilder = new DefaultThemeBuilder({
		copyright: "© 2024 Shota FUJI. This document is licensed under CC BY 4.0",
		faviconSvg: ["Assets", "logo.svg"],
		faviconPng: ["Assets", "logo-64x64.png"],
		siteLogo: ["Assets", "logo.svg"],
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
}

if (import.meta.main) {
	const args = cli.parseArgs(Deno.args, {
		boolean: ["json"],
	});

	log.setup({
		handlers: {
			default: new log.ConsoleHandler("DEBUG", {
				formatter: args.json ? log.jsonFormatter : undefined,
				useColors: args.json ? false : undefined,
			}),
		},
		loggers: {
			macana: {
				level: "DEBUG",
				handlers: ["default"],
			},
		},
	});

	try {
		const start = performance.now();

		await build();

		const duration = performance.now() - start;

		log.info(`Complete docs build, elapsed ${duration}ms`, {
			duration,
		});
	} catch (error) {
		log.critical(`Build aborted due to an error: ${error}`, {
			error,
		});

		Deno.exit(1);
	}
}
