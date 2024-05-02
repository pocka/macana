// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { extname } from "../deps/deno.land/std/path/mod.ts";
import type * as Mdast from "../deps/esm.sh/mdast/types.ts";

import type { ContentParser, ParseParameters } from "./interface.ts";
import type { DocumentContent } from "../types.ts";

import { isJSONCanvas, type JSONCanvas } from "./json_canvas/types.ts";
import { mapNodeAsync } from "./json_canvas/utils.ts";
import { parseMarkdown } from "./obsidian_markdown.ts";

const PROBABLY_URL_PATTERN = /^[a-z0-9]+:/i;
const SEPARATOR = "/";

export class JSONCanvasParseError extends Error {}

export class InvalidJSONCanvasError extends JSONCanvasParseError {
	constructor() {
		super("The data is not valid JSONCanvas data");
	}
}

export class InvalidJSONError extends JSONCanvasParseError {
	constructor(cause: unknown) {
		super();

		const subMessage = cause instanceof Error ? cause.message : String(cause);
		this.message = `JSONCanvas data MUST be valid JSON string: ${subMessage}`;
		this.cause = cause;
	}
}

export type JSONCanvasDocument<T> = DocumentContent<
	"json_canvas",
	JSONCanvas<T>
>;

export class JSONCanvasParser
	implements ContentParser<JSONCanvasDocument<Mdast.Nodes>> {
	async parse(
		{ fileReader, getDocumentToken, getAssetToken }: ParseParameters,
	): Promise<JSONCanvasDocument<Mdast.Nodes>> {
		const text = new TextDecoder().decode(await fileReader.read());

		let json: unknown;
		try {
			json = JSON.parse(text);
		} catch (err) {
			throw new InvalidJSONError(err);
		}

		if (!isJSONCanvas(json)) {
			throw new InvalidJSONCanvasError();
		}

		return {
			kind: "json_canvas",
			content: await mapNodeAsync(json, async (node) => {
				switch (node.type) {
					case "text": {
						return {
							...node,
							text: await parseMarkdown(node.text, {
								getAssetToken,
								getDocumentToken,
							}),
						};
					}
					case "file": {
						if (PROBABLY_URL_PATTERN.test(node.file)) {
							return node;
						}

						const path = node.file.split(SEPARATOR);

						const ext = extname(node.file);
						const token = (!ext || /^\.md$/i.test(ext))
							? await getDocumentToken(path)
							: await getAssetToken(path);

						return {
							...node,
							file: token,
						};
					}
					default: {
						return node;
					}
				}
			}),
			getHash(fragments) {
				const n = fileReader.path.join(SEPARATOR);
				throw new Error(
					`You can't reference part of JSONCanvas via hash syntax.` +
						`Requested ${n} # ${fragments.join(" > ")}`,
				);
			},
		};
	}
}
