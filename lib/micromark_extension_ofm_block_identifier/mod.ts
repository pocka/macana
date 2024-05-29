// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	CompileContext,
	Extension,
	HtmlExtension,
	State,
	Token,
} from "../../deps/esm.sh/micromark-util-types/types.ts";
import { codes } from "../../deps/esm.sh/micromark-util-symbol/mod.ts";
import {
	asciiAlphanumeric,
	markdownLineEndingOrSpace,
} from "../../deps/esm.sh/micromark-util-character/mod.ts";

const enum TokenTypeMap {
	block = "ofmBlockIdentifier",
	caret = "ofmBlockIdentifierCaret",
	ident = "ofmBlockIdentifierIdentifier",
}

export function ofmBlockIdentifierHtml(): HtmlExtension {
	return {
		enter: {
			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			[TokenTypeMap.ident](this: CompileContext, token: Token) {
				this.tag(`<span id="${this.sliceSerialize(token)}"></span>`);
			},
		},
	};
}

export function ofmBlockIdentifier(): Extension {
	return {
		text: {
			[codes.caret]: {
				tokenize(effects, ok, nok) {
					const { previous } = this;

					const start: State = (code) => {
						if (!markdownLineEndingOrSpace(previous) || code !== codes.caret) {
							return nok(code);
						}

						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.block);
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.caret);
						effects.consume(code);
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.exit(TokenTypeMap.caret);
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.ident);

						return ident;
					};

					const ident: State = (code) => {
						if (asciiAlphanumeric(code) || code === codes.dash) {
							effects.consume(code);
							return ident;
						}

						if (code === codes.eof) {
							// @ts-expect-error: micromark heavily relies on ambient module declarations,
							//                   which Deno does not support. APIs also don't accept type parameters.
							effects.exit(TokenTypeMap.ident);

							return ok(code);
						}

						return nok(code);
					};

					return start;
				},
			},
		},
	};
}
