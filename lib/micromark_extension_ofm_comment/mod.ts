// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	CompileContext,
	Construct,
	Extension,
	HtmlExtension,
	State,
	Token,
} from "../../deps/npm/micromark-util-types/types.ts";
import { codes, types } from "../../deps/npm/micromark-util-symbol/mod.ts";
import { markdownLineEnding } from "../../deps/npm/micromark-util-character/mod.ts";

const enum TokenTypeMap {
	inline = "ofmInlineComment",
	block = "ofmBlockComment",
	chunk = "ofmCommentBodyChunk",
	body = "ofmCommentBody",
}

export interface OfmCommentHtmlOptions {
	/**
	 * Whether to preserve comments as HTML comment (<!-- this -->)
	 */
	preserveAsHtmlComment?: boolean;
}

export function ofmCommentHtml(
	{ preserveAsHtmlComment = false }: OfmCommentHtmlOptions = {},
): HtmlExtension {
	if (!preserveAsHtmlComment) {
		return {};
	}

	return {
		enter: {
			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			[TokenTypeMap.block](this: CompileContext) {
				this.raw("<!--");
			},
			[TokenTypeMap.inline](this: CompileContext) {
				this.raw("<!--");
			},
			[TokenTypeMap.chunk](this: CompileContext, token: Token) {
				// Prevent outputting broken HTML
				this.raw(this.sliceSerialize(token).replaceAll("-->", ""));
			},
		},
		exit: {
			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			[TokenTypeMap.block](this: CompileContext) {
				this.raw("-->");
			},
			[TokenTypeMap.inline](this: CompileContext) {
				this.raw("-->");
			},
		},
	};
}

export function ofmComment(): Extension {
	return {
		text: {
			[codes.percentSign]: {
				name: "ofm-inline-comment",
				tokenize(effects, ok, nok) {
					/**
					 * ```markdown
					 * > | %%body%%
					 *     ^^
					 * ```
					 */
					const start: State = (code) => {
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.inline);

						return effects.attempt(startMarker, beforeBody, nok)(code);
					};

					const beforeBody: State = (code) => {
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.body);

						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.chunk);

						return body(code);
					};

					const body: State = (code) => {
						if (code === codes.eof || markdownLineEnding(code)) {
							return nok(code);
						}

						if (code === codes.percentSign) {
							// @ts-expect-error: micromark heavily relies on ambient module declarations,
							//                   which Deno does not support. APIs also don't accept type parameters.
							effects.exit(TokenTypeMap.chunk);

							return effects.attempt(endMarker, beforeEnd, unbondedPercentSign)(
								code,
							);
						}

						effects.consume(code);
						return body;
					};

					const unbondedPercentSign: State = (code) => {
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.chunk);
						effects.consume(code);

						return body;
					};

					const beforeEnd: State = (code) => {
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.exit(TokenTypeMap.inline);

						return ok(code);
					};

					return start;
				},
			},
		},
		flow: {
			[codes.percentSign]: {
				name: "ofm-block-comment",
				concrete: true,
				tokenize(effects, ok, nok) {
					/**
					 * ```markdown
					 * > | %%
					 *     ^^
					 * > | body
					 * > | %%
					 * ```
					 */
					const start: State = (code) => {
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.block);

						return effects.attempt(startMarker, beforeBody, nok)(code);
					};

					const beforeBody: State = (code) => {
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.body);

						return beforeChunk(code);
					};

					const beforeChunk: State = (code) => {
						if (markdownLineEnding(code)) {
							effects.enter(types.lineEnding);
							effects.consume(code);
							effects.exit(types.lineEnding);

							return beforeChunk;
						}

						if (code === codes.percentSign) {
							return effects.attempt(endMarker, beforeEnd, unbondedPercentSign)(
								code,
							);
						}

						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.chunk);

						return chunk(code);
					};

					/**
					 * ```markdown
					 * > | %%
					 * > | body
					 *     ^^^^
					 * > | %%
					 * ```
					 */
					const chunk: State = (code) => {
						if (markdownLineEnding(code)) {
							// @ts-expect-error: micromark heavily relies on ambient module declarations,
							//                   which Deno does not support. APIs also don't accept type parameters.
							effects.exit(TokenTypeMap.chunk);
							effects.enter(types.lineEnding);
							effects.consume(code);
							effects.exit(types.lineEnding);

							return beforeChunk;
						}

						if (code === codes.percentSign) {
							// @ts-expect-error: micromark heavily relies on ambient module declarations,
							//                   which Deno does not support. APIs also don't accept type parameters.
							effects.exit(TokenTypeMap.chunk);

							return effects.attempt(endMarker, beforeEnd, unbondedPercentSign)(
								code,
							);
						}

						effects.consume(code);

						return chunk;
					};

					const unbondedPercentSign: State = (code) => {
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.enter(TokenTypeMap.chunk);

						effects.consume(code);

						return chunk;
					};

					const beforeEnd: State = (code) => {
						// @ts-expect-error: micromark heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						effects.exit(TokenTypeMap.block);

						return ok(code);
					};

					return start;
				},
			},
		},
	};
}

const startMarker: Construct = {
	partial: true,
	tokenize(effects, ok, nok) {
		const { previous } = this;

		/**
		 * ```markdown
		 * > | %%
		 *     ^
		 * ```
		 */
		const first: State = (code) => {
			if (code !== codes.percentSign || previous === codes.backslash) {
				return nok(code);
			}

			effects.consume(code);

			return second;
		};

		/**
		 * ```markdown
		 * > | %%
		 *      ^
		 * ```
		 */
		const second: State = (code) => {
			if (code !== codes.percentSign) {
				return nok(code);
			}

			effects.consume(code);

			return ok(code);
		};

		return first;
	},
};

const endMarker: Construct = {
	partial: true,
	tokenize(effects, ok, nok) {
		const { previous } = this;

		/**
		 * ```markdown
		 * > | %%
		 *     ^
		 * ```
		 */
		const first: State = (code) => {
			if (code !== codes.percentSign || previous === codes.backslash) {
				return nok(code);
			}

			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			effects.exit(TokenTypeMap.body);

			effects.consume(code);

			return second;
		};

		/**
		 * ```markdown
		 * > | %%
		 *      ^
		 * ```
		 */
		const second: State = (code) => {
			if (code !== codes.percentSign) {
				return nok(code);
			}

			effects.consume(code);

			return ok(code);
		};

		return first;
	},
};
