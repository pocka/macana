// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as log from "../deps/deno.land/std/log/mod.ts";
import * as cli from "../deps/deno.land/std/cli/mod.ts";
import * as colors from "../deps/deno.land/std/fmt/colors.ts";

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
import { DefaultThemeBuilder } from "../page_builder/default_theme/mod.ts";

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
			langDir({
				en: "English",
				ja: "日本語",
			}, true),
		],
		resolveShortestPathWhenPossible: true,
	});
	const contentParser = oneof(
		new JSONCanvasParser(),
		new ObsidianMarkdownParser({ frontmatter: true }),
	);
	const pageBuilder = new DefaultThemeBuilder({
		siteName: "Macana",
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

function prettyLogFormatter(
	useColors: boolean,
	verbose: boolean,
): log.FormatterFunction {
	function id<T>(x: T): T {
		return x;
	}

	function pipe<T>(a: (x: T) => T, b: (x: T) => T): (x: T) => T {
		return (x) => b(a(x));
	}

	const ts = useColors ? pipe(colors.black, colors.dim) : id;

	return (record) => {
		let level: (str: string) => string = id;
		let msg: (str: string) => string = id;
		let payload: (str: string) => string = id;

		if (useColors) {
			switch (record.level) {
				case log.LogLevels.NOTSET:
					level = colors.dim;
					msg = colors.dim;
					payload = colors.dim;
					break;
				case log.LogLevels.DEBUG:
					level = colors.gray;
					msg = colors.gray;
					payload = pipe(colors.dim, colors.black);
					break;
				case log.LogLevels.INFO:
					level = colors.blue;
					msg = pipe(colors.bold, colors.black);
					payload = colors.black;
					break;
				case log.LogLevels.WARN:
					level = colors.yellow;
					msg = colors.black;
					payload = colors.black;
					break;
				case log.LogLevels.ERROR:
					level = colors.red;
					msg = colors.black;
					payload = colors.black;
					break;
				case log.LogLevels.CRITICAL:
					level = pipe(colors.red, colors.bold);
					msg = pipe(colors.bold, colors.red);
					payload = colors.red;
					break;
			}
		}

		let ret = "\n" + level(record.levelName) + " " +
			ts(record.datetime.toISOString()) + "\n" +
			msg(record.msg);

		if (verbose) {
			for (const arg of record.args) {
				const text = Deno.inspect(arg, {
					colors: useColors,
					compact: false,
				});

				for (const line of text.split("\n")) {
					ret += "\n    " + payload(line);
				}
			}
		}

		return ret;
	};
}

if (import.meta.main) {
	const args = cli.parseArgs(Deno.args, {
		string: ["log"],
		boolean: ["json", "verbose", "help"],
		alias: {
			"help": ["h"],
		},
	});

	const useColors = Deno.stdout.isTerminal();

	if (args.help) {
		const title = useColors
			? (s: string) => colors.underline(colors.bold(s))
			: (s: string) => s;

		console.log(`
docs/build.ts

Build Macana's documentation website using Macana.

${title("Usage")}:
    deno run --allow-read=docs --allow-write=docs/.dist docs/build.ts [OPTIONS]

${title("Options")}:
    -h, --help
        Print this help text to stdout and exit.

    --log=<debug|info|warn|error|critical>
        Set the lowest log level to output.
        By default, docs/build.ts logs INFO, WARN, ERROR, and CRITICAL level logs.

    --json
        Output logs as JSON Lines.

    --verbose
        Output additional information alongisde log messages.
        This does not take effect when ${colors.bold("--json")} is set.
		`.trim());
		Deno.exit(0);
	}

	let level: log.LevelName = "INFO";
	if (args.log) {
		const upper = args.log.toUpperCase() as log.LevelName;
		const found = log.LogLevelNames.includes(upper);
		if (found) {
			level = upper;
		} else {
			log.critical(
				`"${args.log}" is not a valid log level.\n` +
					` Available log levels are: ${log.LogLevelNames.join(", ")}`,
			);
			Deno.exit(1);
		}
	}

	log.setup({
		handlers: {
			default: new log.ConsoleHandler(level, {
				formatter: args.json
					? log.jsonFormatter
					: prettyLogFormatter(useColors, args.verbose),
				useColors,
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
