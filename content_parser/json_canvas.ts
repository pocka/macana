// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	ContentParser,
	DocumentContent,
	ParseParameters,
} from "./interface.ts";

import { isJSONCanvas, type JSONCanvas } from "./json_canvas/types.ts";

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

export type JSONCanvasDocument = DocumentContent<
	"json_canvas",
	JSONCanvas
>;

export class JSONCanvasParser implements ContentParser {
	async parse({ fileReader }: ParseParameters): Promise<JSONCanvasDocument> {
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
			content: json,
		};
	}
}
