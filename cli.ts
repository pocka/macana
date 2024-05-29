// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as log from "./deps/deno.land/std/log/mod.ts";
import * as cli from "./deps/deno.land/std/cli/mod.ts";
import * as colors from "./deps/deno.land/std/fmt/colors.ts";
import * as jsonc from "./deps/deno.land/std/jsonc/mod.ts";
import * as path from "./deps/deno.land/std/path/mod.ts";

import { DenoFsReader } from "./internal/filesystem_reader/deno_fs.ts";
import { DenoFsWriter } from "./internal/filesystem_writer/deno_fs.ts";
import { noOverwrite } from "./internal/filesystem_writer/no_overwrite.ts";
import { precompress as precompressMiddleware } from "./internal/filesystem_writer/precompress.ts";
import {
	DefaultTreeBuilder,
	fileExtensions,
	ignoreDotfiles,
	langDir,
	removeExtFromMetadata,
} from "./internal/tree_builder/default_tree_builder.ts";
import type { ContentParser } from "./internal/content_parser/interface.ts";
import { oneof } from "./internal/content_parser/oneof.ts";
import { ObsidianMarkdownParser } from "./internal/content_parser/obsidian_markdown.ts";
import { JSONCanvasParser } from "./internal/content_parser/json_canvas.ts";
import { DefaultThemeBuilder } from "./internal/page_builder/default_theme/mod.ts";

import * as config from "./internal/cli/config.ts";

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
		let ret = colors.reset("\n") + level(record.levelName) + colors.reset(" ") +
			ts(record.datetime.toISOString()) + colors.reset("\n") +
			msg(record.msg);

		if (verbose) {
			for (const arg of record.args) {
				const text = Deno.inspect(arg, {
					colors: useColors,
					compact: false,
				});

				for (const line of text.split("\n")) {
					ret += colors.reset("\n    ") + payload(line);
				}
			}
		}

		return ret;
	};
}

function parseColorPreference(value?: string): "auto" | "never" | "always" {
	if (!value) {
		return "auto";
	}

	switch (value) {
		case "auto":
		case "never":
		case "always":
			return value;
		default:
			throw new Error(`"${value}" is not a valid color option value`);
	}
}

export async function run(
	args: readonly string[],
	isStdoutTerminal: boolean,
): Promise<number> {
	const flags = cli.parseArgs(args.slice(), {
		string: [
			"log",
			"color",
			"config",
			"out",
			"copyright",
			"name",
			"favicon-png",
			"favicon-svg",
			"logo-image",
			"doc-ext",
			"lang",
			"base-url",
			"og-image",
			"user-css",
		],
		boolean: [
			"help",
			"verbose",
			"json",
			"keep-ext",
			"precompress",
			"disable-markdown",
			"disable-jsoncanvas",
			"markdown-frontmatter",
			"shortest-path-when-possible",
		],
		alias: {
			help: ["h"],
		},
	});

	const color = parseColorPreference(flags.color);

	const isColoredStdout = color === "always" ||
		(color === "auto" && isStdoutTerminal);

	if (flags.help) {
		console.log(help(isColoredStdout));
		return 0;
	}

	let level: log.LevelName = "INFO";
	if (flags.log) {
		const upper = flags.log.toUpperCase() as log.LevelName;
		const found = log.LogLevelNames.includes(upper);
		if (found) {
			level = upper;
		} else {
			log.critical(
				`"${flags.log}" is not a valid log level. ` +
					`Available log levels are: ${log.LogLevelNames.join(", ")}`,
			);
			return 1;
		}
	}

	log.setup({
		handlers: {
			default: new log.ConsoleHandler(level, {
				formatter: flags.json
					? log.jsonFormatter
					: prettyLogFormatter(isColoredStdout, flags.verbose),
				useColors: isColoredStdout,
			}),
		},
		loggers: {
			default: {
				level: level,
				handlers: ["default"],
			},
			macana: {
				level: "DEBUG",
				handlers: ["default"],
			},
		},
	});

	const configFile = flags.config ? parseConfigFile(flags.config) : {};

	try {
		const start = performance.now();

		const arg0 = typeof flags._[0] !== "undefined" ? String(flags._[0]) : null;
		const inputPath = arg0 || configFile.input?.path;
		if (!inputPath) {
			throw new Error(
				"Input path (VAULT_PATH argument, `input.path`) is required",
			);
		}

		await Deno.permissions.request({
			name: "read",
			path: inputPath,
		});

		log.debug(`Using "${inputPath}" as source directory`, {
			inputPath,
		});
		const fileSystemReader = new DenoFsReader(inputPath);

		const outputPath = flags.out || configFile.output?.path;
		if (!outputPath) {
			throw new Error("Output path (--out, `output.path` is required");
		}

		await Deno.permissions.request({
			name: "write",
			path: outputPath,
		});

		await Deno.mkdir(outputPath, { recursive: true });

		log.debug(`Using "${outputPath}" as output directory`, {
			outputPath,
		});
		let fileSystemWriter = noOverwrite(new DenoFsWriter(outputPath));

		const precompress = flags.precompress || configFile.output?.precompress;
		if (precompress) {
			log.debug("output.precompress = true");
			fileSystemWriter = precompressMiddleware()(fileSystemWriter);
		}

		const defaultLanguage = flags.lang ||
			configFile.documents?.defaultLanguage || "en";

		log.debug(`Use "${defaultLanguage}" as default language`, {
			defaultLanguage,
			languages: configFile.documents?.languages,
		});

		const keepExtension = flags["keep-ext"] ||
			configFile.documents?.title?.keepExtension;
		if (keepExtension) {
			log.debug("documents.title.keepExtension = true");
		}

		const resolveShortestPathWhenPossible =
			flags["shortest-path-when-possible"] ||
			configFile.documents?.resolveShortestPathWhenPossible;
		if (resolveShortestPathWhenPossible) {
			log.debug("documents.resolveShortestPathWhenPossible = true");
		}

		const markdownDisabled = flags["disable-markdown"] ||
			configFile.markdown?.enabled === false;
		if (markdownDisabled) {
			log.debug("documents.markdown.enabled = false");
		}

		const yamlFrontmatter = flags["markdown-frontmatter"] ||
			configFile.markdown?.yamlFrontmatter;
		if (yamlFrontmatter) {
			log.debug("markdown.yamlFrontmatter = true");
		}

		const jsonCanvasDisabled = flags["disable-jsoncanvas"] ||
			configFile.jsonCanvas?.enabled === false;
		if (jsonCanvasDisabled) {
			log.debug("documents.jsonCanvas.enabled = false");
		}

		const parsers: readonly ContentParser[] = [
			jsonCanvasDisabled ? null : new JSONCanvasParser(),
			markdownDisabled
				? null
				: new ObsidianMarkdownParser({ frontmatter: yamlFrontmatter }),
		].filter((p): p is NonNullable<typeof p> => !!p);

		if (parsers.length === 0) {
			throw new Error(
				"You can't disable both Markdown and JSONCanvas documents",
			);
		}

		const treeBuilder = new DefaultTreeBuilder({
			defaultLanguage,
			ignore: [ignoreDotfiles],
			strategies: [
				fileExtensions([
					markdownDisabled ? null : ".md",
					jsonCanvasDisabled ? null : ".canvas",
				].filter((s): s is string => !!s)),
				configFile.documents?.languages
					? langDir(
						Object.fromEntries(
							Object.entries(configFile.documents.languages).map(
								([lang, { title }]) => [lang, title],
							),
						),
					)
					: null,
				keepExtension ? null : removeExtFromMetadata(),
			].filter((s): s is NonNullable<typeof s> => !!s),
			resolveShortestPathWhenPossible,
		});

		const contentParser = oneof(...parsers);

		const siteName = flags.name || configFile.metadata?.name;
		if (!siteName) {
			throw new Error("Site name (--name, `metadata.name`) is required");
		}
		log.debug(`metadata.name = ${siteName}`);

		const copyright = flags.copyright || configFile.metadata?.copyright;
		if (!copyright) {
			throw new Error(
				"Copyright text (--copyright, `metadata.copyright`) is required",
			);
		}
		log.debug(`metadata.copyright = ${copyright}`);

		let faviconSvg: Uint8Array | undefined = undefined;
		const faviconSvgPath = flags["favicon-svg"] ||
			configFile.metadata?.favicon?.svg;
		if (faviconSvgPath) {
			log.debug(`Reads favicon SVG from "${faviconSvgPath}"`);
			faviconSvg = Deno.readFileSync(faviconSvgPath);
		}

		let faviconPng: Uint8Array | undefined = undefined;
		const faviconPngPath = flags["favicon-png"] ||
			configFile.metadata?.favicon?.png;
		if (faviconPngPath) {
			log.debug(`Reads favicon PNG from "${faviconPngPath}"`);
			faviconPng = Deno.readFileSync(faviconPngPath);
		}

		let siteLogo: { ext: string; binary: Uint8Array } | undefined = undefined;
		const siteLogoPath = flags["logo-image"] || configFile.metadata?.logoImage;
		if (siteLogoPath) {
			log.debug(`Reads site logo image fron "${siteLogoPath}"`);
			siteLogo = {
				ext: path.extname(siteLogoPath),
				binary: Deno.readFileSync(siteLogoPath),
			};
		}

		let isFullBaseURL = false;
		const baseURL = flags["base-url"] || configFile.output?.baseURL;
		try {
			if (baseURL) {
				const url = new URL(baseURL, "macana://placeholder");
				// If the `baseURL` is valid full URL, it overrides the "macana://placeholder" and
				// `protocol` would be one of the given URL.
				isFullBaseURL = url.protocol !== "macana:";
			}
		} catch (error) {
			throw new Error(
				`baseURL is not valid URL nor path: ${String(error)}`,
				{ cause: error },
			);
		}

		let ogImage: { ext: string; data: Uint8Array } | undefined = undefined;
		const ogImagePath = flags["og-image"] ||
			configFile.metadata?.openGraph?.image;
		if (ogImagePath) {
			log.debug(`metadata.openGraph.image = "${ogImagePath}"`);
			if (isFullBaseURL) {
				ogImage = {
					ext: path.extname(ogImagePath),
					data: Deno.readFileSync(ogImagePath),
				};
			} else {
				log.warn(
					"Open Graph image is set but base URL is not full URL: ignoring `metadata.openGraph.image` field.",
				);
			}
		}

		const userCSSInput = flags["user-css"] || configFile.output?.userCSS;
		const userCSS = userCSSInput
			? fileSystemReader.fromFsPath(userCSSInput)
			: undefined;

		const pageBuilder = new DefaultThemeBuilder({
			siteName,
			copyright,
			faviconSvg,
			faviconPng,
			siteLogo,
			baseURL,
			openGraph: ogImage && {
				image: ogImage,
			},
			userCSS,
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

		const duration = performance.now() - start;

		log.info(`Generated website in ${duration}ms`, {
			duration,
		});

		return 0;
	} catch (error) {
		log.critical(`Build aborted due to an error: ${error}`, {
			error,
		});

		return 1;
	}
}

function help(isColorEnabled: boolean): string {
	const id = (s: string) => s;

	const title = isColorEnabled
		? (s: string) => colors.underline(colors.bold(s))
		: id;

	const b = isColorEnabled ? colors.bold : id;

	const p = isColorEnabled ? colors.blue : id;

	const t = isColorEnabled ? colors.green : id;

	const v = isColorEnabled ? colors.red : id;

	return colors.reset(`
macana/cli.ts - Generate static website from Obsidian Vault.

${title("Usage")}:
  deno run --allow-read=.,<CONFIG_PATH> --allow-write=<OUTDIR> macana/cli.ts --config <CONFIG_PATH>

  deno run --allow-read=. --allow-write=<OUTDIR> macana/cli.ts [OPTIONS] <VAULT_PATH>

${title("Arguments")}:
  VAULT_PATH
    Path to the Vault directory. This is required if "--config" option is not present.
    Corresponding config key is ${p("input.path")} (${t("string")}).

${title("Permissions")}:
  ${b("read")}
    Macana requires file system read permission for the current directory, ${
		b("VAULT_PATH")
	}
    and ${b("CONFIG_PATH")} (if ${
		b("--config")
	} option is set). Permission for the current
    directory is required due to a technical limitation: there is no way to resolve a relative
    path without accessing CWD in Deno.

  ${b("write")}
    Macana requires file system write permission for ${
		b("OUTDIR")
	} in order to write
    generated website files.

${title("Options")}:
  -h, --help
    Print this help text to stdout then exit.

  --log <debug|info|warn|error|critical>
    Set the lowest log level to output. [default: info]

  --json
    Output logs as JSON Lines.

  --color <always|never|auto>
    When to output ANSI escape sequences in the log output.

  --verbose
    Output log payload alongside log message.
    If ${b("--json")} option is set, this flag is always on.

  --config <PATH>
    Use config JSON or JSONC file at PATH. CLI options takes precedence over ones defined
    in the config file. Most of the build options are configurable via both CLI options
    and config file. Macana parse the file as JSON if the file name ends with ".json" and
    as JSONC (JSON with Comment) if the file name ends with ".jsonc". Use JSONC if you want to
    use trailing comma and/or comments.
    However, due to technical limitation, ${
		p("documents.languages")
	} cannot be set via CLI options.
    This option is a key-value object, where key is a directory name for the language directory
    and value is ${t("{ title: string; lang: string; }")}. ${
		p("documents.languages[language].title")
	}
    is a display title of the directory and ${
		p("documents.lang[language].lang")
	} is a language
    code that directory indicates. For example, when a Vault has "en/" and you set
    ${v('{ en: { title: "English", lang: "en-US" }')} to ${
		p("documents.lang")
	}, the directory
    will be displayed as "English" and it and its content will be shown as "lang=en-US".

  --out <PATH>
    Path to the output directory. Macana creates the target directory if it does not
    exist at the path. Use slash ("/") for path separator regardless of platform.
    Corresponding config key is ${p("output.path")} (${t("string")}).

  --user-css <PATH>
    Path to the user provided CSS. This CSS contents will be appended to the final CSS:
    this CSS can override every styles. The target file MUST be inside ${
		b("VAULT_PATH")
	}.
    Corresponding config key is ${p("output.userCSS")} (${t("string")}).

  --base-url <PATH OR URL>
    URL or path to base at.
    Corresponding config key is ${p("output.baseURL")} (${t("string")}).

  --copyright <TEXT>
    Copyright text to display on the generated website.
    Corresponding config key is ${p("metadata.copyright")} (${t("string")}).

  --name <TEXT>
    Name of the generated website.
    Corresponding config key is ${p("metadata.name")} (${t("string")}).

  --favicon-png <PATH>
    Path for PNG favicon image.
    ${b("The file needs to be inside the VAULT_PATH")}.
    Corresponding config key is ${p("metadata.favicon.png")} (${t("string")}).

  --favicon-svg <PATH>
    Path for SVG favicon image.
    ${b("The file needs to be inside the VAULT_PATH")}.
    Corresponding config key is ${p("metadata.favicon.svg")} (${t("string")}).

  --logo-image <PATH>
    Image file to use as a logo image.
    ${b("The file needs to be inside the VAULT_PATH")}.
    Corresponding config key is ${p("metadata.logoImage")} (${t("string")}).

  --keep-ext
    Keep file extension in document title.
    Corresponding config key is ${p("documents.title.keepExtension")} (${
		t("boolean")
	}).

  --lang <LANG>
    Set default language for the website.
    [default: en]
    Corresponding config key is ${p("documents.defaultLanguage")} (${
		t("string")
	}).

  --shortest-path-when-possible
    Enable "Shortest path when possible" resolution.
    Corresponding config key is ${
		p("documents.resolveShortestPathWhenPossible")
	} (${t("boolean")}).

  --precompress
    Compress .html/.css/.js files using gzip,brotli,zstd and write the compressed files
    alongside the original files. For example, if the website has "index.html", Macana
    writes "index.html", "index.html.gz", "index.html.br" and "index.html.zstd".
    This output format is for useful if your web server supports serving precompressed
    files.
    Corresponding config key is ${p("documents.precompress")} (${t("boolean")}).

  --disable-markdown
    Disable parsing of Markdown files (.md).
    To configure this via config file, set ${p("markdown.enabled")} to ${
		v("false")
	}.

  --disable-jsoncanvas
    Disable parsing of JSON Canvas files (.canvas).
    To configure this via config file, set ${p("jsonCanvas.enabled")} to ${
		v("false")
	}.

  --markdown-frontmatter
    Parse YAML frontmatter in Markdown files.
    Corresponding config key is ${p("markdown.yamlFrontmatter")} (${
		t("boolean")
	}).


${title("Examples")}:
  Generate website from Vault located at "./vault/", with config file "./macana.json" then
  write it under "./out".

    deno run --allow-read=.,macana.json --allow-write=out macana/cli.ts ./macana.json


  Same as the above, but the config file is at "./vault/.macana/config.json".

    deno run --allow-read=. --allow-write=out macana/cli.ts ./vault/.macana/config.json


  Generate website without using config file.

    deno run \\
      --allow-read=. --allow-write=out \\
      macana/cli.ts \\
      --out ./out \\
      --name "Foo Bar" \\
      --copyright "Copyright 2020 John Doe" \\
      ./vault
	`).trim();
}

function parseConfigFile(configPath: string): config.MacanaConfig {
	const ext = path.extname(configPath);

	let x: unknown;
	switch (ext) {
		case ".json": {
			x = JSON.parse(Deno.readTextFileSync(configPath));
			break;
		}
		case ".jsonc": {
			x = jsonc.parse(Deno.readTextFileSync(configPath), {
				allowTrailingComma: true,
			});
			break;
		}
		default: {
			throw new Error(
				`Unknown config object, file extension needs to be either of .json or .jsonc (got ${ext})`,
			);
		}
	}

	return config.parse(x, configPath);
}

if (import.meta.main) {
	Deno.exit(await run(Deno.args, Deno.stdout.isTerminal()));
}
