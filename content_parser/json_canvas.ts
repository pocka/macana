// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../deps/esm.sh/mdast/types.ts";

import type { ContentParser, ParseParameters } from "./interface.ts";
import type { DocumentContent } from "../types.ts";

import { isJSONCanvas, type JSONCanvas } from "./json_canvas/types.ts";
import { mapText } from "./json_canvas/utils.ts";
import { parseMarkdown } from "./obsidian_markdown.ts";

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
			content: await mapText(json, async (node) => {
				return parseMarkdown(node.text, {
					getAssetToken,
					getDocumentToken,
				});
			}),
		};
	}
}
