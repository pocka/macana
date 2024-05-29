// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as path from "../deps/deno.land/std/path/mod.ts";

import * as parser from "./parser.ts";

export interface MacanaConfig {
	input?: {
		path?: string;
	};

	output?: {
		path?: string;

		precompress?: boolean;

		baseURL?: string;
	};

	metadata?: {
		name?: string;

		favicon?: {
			svg?: string;
			png?: string;
		};

		copyright?: string;

		logoImage?: string;

		openGraph?: {
			image?: string;
		};
	};

	documents?: {
		defaultLanguage?: string;

		languages?: Record<string, { title: string; lang: string }>;

		resolveShortestPathWhenPossible?: boolean;

		title?: {
			keepExtension?: boolean;
		};
	};

	markdown?: {
		enabled?: boolean;

		yamlFrontmatter?: boolean;
	};

	jsonCanvas?: {
		enabled?: boolean;
	};
}

function pathParser(configFilePath: string) {
	return parser.map(
		parser.string({ nonEmpty: true, trim: true }),
		(p) => path.join(configFilePath, p),
	);
}

function configParser(configFilePath: string): parser.Parser<MacanaConfig> {
	const fsPathParser = pathParser(path.dirname(configFilePath));

	return parser.object({
		input: parser.object({
			path: fsPathParser,
		}),
		output: parser.object({
			path: fsPathParser,
			baseURL: parser.string({ nonEmpty: true, trim: true }),
			precompress: parser.boolean,
		}),
		metadata: parser.object({
			name: parser.string({ nonEmpty: true }),
			favicon: parser.object({
				svg: fsPathParser,
				png: fsPathParser,
			}),
			copyright: parser.string(),
			logoImage: fsPathParser,
			openGraph: parser.object({
				image: fsPathParser,
			}),
		}),
		documents: parser.object({
			defaultLanguage: parser.string({ nonEmpty: true }),
			languages: parser.record(
				parser.string({ nonEmpty: true }),
				parser.object({
					title: parser.string({ nonEmpty: true }),
					lang: parser.string({ nonEmpty: true }),
				}, {
					optional: false,
				}),
			),
			resolveShortestPathWhenPossible: parser.boolean,
			title: parser.object({
				keepExtension: parser.boolean,
			}),
		}),
		markdown: parser.object({
			enabled: parser.boolean,
			yamlFrontmatter: parser.boolean,
		}),
		jsonCanvas: parser.object({
			enabled: parser.boolean,
		}),
	});
}

export function parse(x: unknown, filePath: string): MacanaConfig {
	return parser.parse(x, configParser(filePath));
}
