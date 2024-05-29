// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { extname } from "../../deps/deno.land/std/path/mod.ts";

import type {
	CompileContext,
	Construct,
	Extension,
	HtmlExtension,
	State,
	Token,
	Tokenizer,
} from "../../deps/esm.sh/micromark-util-types/types.ts";
import { codes } from "../../deps/esm.sh/micromark-util-symbol/mod.ts";

const enum TokenTypeMap {
	start = "ofmWikilinkStart",
	end = "ofmWikilinkEnd",
	wikilink = "ofmWikilink",
	target = "ofmWikilinkTarget",
	label = "ofmWikilinkLabel",
	embed = "ofmWikilinkEmbed",
}

export function ofmWikilinkHtml(): HtmlExtension {
	return {
		enter: {
			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			[TokenTypeMap.wikilink](this: CompileContext) {
				this.tag(`<a href="`);
			},
			[TokenTypeMap.embed](this: CompileContext) {
				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				this.setData("wikilinkEmbed", true);
			},
			[TokenTypeMap.target](this: CompileContext, token: Token) {
				const target = this.sliceSerialize(token);

				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				this.setData("wikilinkTarget", target);

				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				const isEmbed = this.getData("wikilinkEmbed");
				if (isEmbed) {
					return;
				}

				this.tag(target + `">`);
			},
			[TokenTypeMap.label](this: CompileContext, token: Token) {
				const label = this.sliceSerialize(token);

				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				this.setData("wikilinkLabel", label);

				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				const isEmbed = this.getData("wikilinkEmbed");
				if (isEmbed) {
					return;
				}

				this.tag(label);
			},
		},
		exit: {
			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			[TokenTypeMap.wikilink](this: CompileContext) {
				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				const target: string | undefined = this.getData("wikilinkTarget");
				if (!target) {
					throw new Error("Empty Wikilink target found");
				}

				const label = this.getData(
					// @ts-expect-error: micromark heavily relies on ambient module declarations,
					//                   which Deno does not support. APIs also don't accept type parameters.
					"wikilinkLabel",
				) as string | undefined;
				if (!label) {
					this.tag(target);
				}

				this.tag(`</a>`);
			},
			[TokenTypeMap.embed](this: CompileContext) {
				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				const target: string | undefined = this.getData("wikilinkTarget");
				if (!target) {
					throw new Error("Empty Wikilink target found");
				}

				const label = this.getData(
					// @ts-expect-error: micromark heavily relies on ambient module declarations,
					//                   which Deno does not support. APIs also don't accept type parameters.
					"wikilinkLabel",
				) as string | undefined;

				switch (extname(target).toLowerCase()) {
					case ".jpg":
					case ".jpeg":
					case ".avif":
					case ".bmp":
					case ".png":
					case ".svg":
					case ".webp": {
						this.tag(`<img src="${target}"`);
						if (label) {
							this.tag(` alt="${label}"`);
						}
						this.tag(`>`);
						return;
					}
					case ".flac":
					case ".m4a":
					case ".mp3":
					case ".ogg":
					case ".wav":
					case ".3gp": {
						this.tag(`<audio src="${target}"`);
						if (label) {
							this.tag(` title="${label}"`);
						}
						this.tag(`></audio>`);
						return;
					}
					case ".mkv":
					case ".mov":
					case ".mp4":
					case ".ogv":
					case ".webm": {
						this.tag(`<video src="${target}"`);
						if (label) {
							this.tag(` title="${label}"`);
						}
						this.tag(`></video>`);
						return;
					}
					default: {
						this.tag(`<iframe src="${target}"`);
						if (label) {
							this.tag(` title="${label}"`);
						}
						this.tag(`></iframe>`);
						return;
					}
				}
			},
		},
	};
}

export function ofmWikilink(): Extension {
	return {
		text: {
			[codes.leftSquareBracket]: construct,
			[codes.exclamationMark]: construct,
		},
	};
}

const tokenize: Tokenizer = function (effects, ok, nok) {
	const { previous } = this;
	let type: TokenTypeMap.wikilink | TokenTypeMap.embed = TokenTypeMap.wikilink;

	/**
	 * ```markdown
	 * > | [[target|label]]
	 *     ^
	 *
	 * > | ![[target|label]]
	 *     ^
	 * ```
	 */
	const start: State = function (code) {
		if (code === codes.exclamationMark && previous !== codes.backslash) {
			type = TokenTypeMap.embed;
			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			effects.enter(type);
			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			effects.enter(TokenTypeMap.start);
			effects.consume(code);
			return start;
		}

		// Skip when escaped
		if (code !== codes.leftSquareBracket || previous === codes.backslash) {
			return nok(code);
		}

		if (type === TokenTypeMap.wikilink) {
			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			effects.enter(type);
			// @ts-expect-error: micromark heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			effects.enter(TokenTypeMap.start);
		}

		effects.consume(code);

		return beforeTarget;
	};

	/**
	 * ```markdown
	 * > | [[target|label]]
	 *      ^
	 * ```
	 */
	const beforeTarget: State = function (code) {
		if (code !== codes.leftSquareBracket) {
			return nok(code);
		}

		effects.consume(code);

		// @ts-expect-error: micromark heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		effects.exit(TokenTypeMap.start);
		// @ts-expect-error: micromark heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		effects.enter(TokenTypeMap.target);

		return target;
	};

	/**
	 * ```markdown
	 * > | [[target|label]]
	 *       ^^^^^^
	 * ```
	 */
	const target: State = function (code) {
		switch (code) {
			case codes.leftSquareBracket:
			case codes.carriageReturn:
			case codes.lineFeed:
			case codes.eof:
				return nok(code);
			case codes.verticalBar:
				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				effects.exit(TokenTypeMap.target);
				effects.consume(code);
				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				effects.enter(TokenTypeMap.label);
				return label;
			// Empty wikilink is not allowed.
			case codes.rightSquareBracket:
				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				effects.exit(TokenTypeMap.target);

				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				effects.enter(TokenTypeMap.end);
				effects.consume(code);
				return end;
			default:
				effects.consume(code);
				return target;
		}
	};

	/**
	 * ```markdown
	 * > | [[target|label]]
	 *              ^^^^^
	 * ```
	 */
	const label: State = function (code) {
		switch (code) {
			case codes.carriageReturn:
			case codes.lineFeed:
			case codes.eof:
				return nok(code);
			// Empty wikilink is not allowed.
			case codes.rightSquareBracket:
				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				effects.exit(TokenTypeMap.label);
				effects.consume(code);

				// @ts-expect-error: micromark heavily relies on ambient module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				effects.enter(TokenTypeMap.end);

				return end;
			default:
				effects.consume(code);
				return label;
		}
	};

	const end: State = function (code) {
		if (code !== codes.rightSquareBracket) {
			return nok(code);
		}

		effects.consume(code);

		// @ts-expect-error: micromark heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		effects.exit(TokenTypeMap.end);

		// @ts-expect-error: micromark heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		effects.exit(type);

		return ok(code);
	};

	return start;
};

const construct: Construct = {
	name: "ofm-wikilink",
	tokenize,
};
