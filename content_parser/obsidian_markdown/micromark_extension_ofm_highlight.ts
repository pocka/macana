// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	CompileContext,
	Construct,
	Event,
	Extension,
	HtmlExtension,
	Resolver,
	State,
	Token,
	Tokenizer,
} from "../../deps/esm.sh/micromark-util-types/types.ts";
import {
	codes,
	constants,
	types,
} from "../../deps/esm.sh/micromark-util-symbol/mod.ts";
import { classifyCharacter } from "../../deps/esm.sh/micromark-util-classify-character/mod.ts";
import { splice } from "../../deps/esm.sh/micromark-util-chunked/mod.ts";
import { resolveAll } from "../../deps/esm.sh/micromark-util-resolve-all/mod.ts";

const enum TokenTypeMap {
	sequenceTemporary = "ofmHighlightSequenceTemporary",
	sequence = "ofmHighlightSequence",
	highlight = "ofmHighlight",
	highlightText = "ofmHighlightText",
}

export function ofmHighlightHtml(): HtmlExtension {
	return {
		enter: {
			// @ts-expect-error: micromark heavily relies on ambiend module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			[TokenTypeMap.highlight](this: CompileContext) {
				this.tag("<mark>");
			},
		},
		exit: {
			// @ts-expect-error: micromark heavily relies on ambiend module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			[TokenTypeMap.highlight](this: CompileContext) {
				this.tag("</mark>");
			},
		},
	};
}

export function ofmHighlight(): Extension {
	return {
		text: {
			[codes.equalsTo]: construct,
		},
		attentionMarkers: { null: [codes.equalsTo] },
	};
}

const tokenizer: Tokenizer = function (effects, ok, nok) {
	const { previous, events } = this;
	let count = 0;

	const start: State = function (code) {
		// This is from strikethrough extension, but I have no idea what it does.
		if (
			previous === codes.equalsTo &&
			events[events.length - 1][1].type !== types.characterEscape
		) {
			return nok(code);
		}

		// @ts-expect-error: micromark heavily relies on ambiend module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		effects.enter(TokenTypeMap.sequenceTemporary);
		return more(code);
	};

	const more: State = function (code) {
		// The first or subsequent equal signs. No other characters appeared yet.
		if (code === codes.equalsTo) {
			effects.consume(code);
			count += 1;
			return more;
		}

		// Reject single equals, e.g. "=foo="
		if (count < 2) {
			return nok(code);
		}

		// Since the character we are looking right now is no longer an equal sign,
		// we can exit temporary state and start consuming next phrasing-something-idk.
		// @ts-expect-error: micromark heavily relies on ambiend module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		const token = effects.exit(TokenTypeMap.sequenceTemporary);

		const before = classifyCharacter(previous);
		const after = classifyCharacter(code);

		token._open = !after ||
			(after === constants.attentionSideAfter && !!before);
		token._close = !before ||
			(before === constants.attentionSideAfter && !!after);

		return ok(code);
	};

	return start;
};

// Mutate events
const resolver: Resolver = function (events, context) {
	for (let i = 0; i < events.length; i++) {
		// If the event is not an end of temporary sequence we set on the tokenizer, skip.
		if (
			events[i][0] !== "enter" ||
			// @ts-expect-error: micromark heavily relies on ambiend module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			events[i][1].type !== TokenTypeMap.sequenceTemporary ||
			!events[i][1]._close
		) {
			continue;
		}

		// Walk back to find an open sequence
		for (let j = i; j > 0; j--) {
			// If the event is not a start of temporary sequence we set on the tokenizer, skip.
			if (
				events[j][0] !== "exit" ||
				// @ts-expect-error: micromark heavily relies on ambiend module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				events[j][1].type !== TokenTypeMap.sequenceTemporary ||
				!events[j][1]._open
			) {
				continue;
			}

			// @ts-expect-error: micromark heavily relies on ambiend module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			events[i][1].type = TokenTypeMap.sequence;
			// @ts-expect-error: micromark heavily relies on ambiend module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			events[j][1].type = TokenTypeMap.sequence;

			// The whole highlight section, including sequences.
			const highlight: Token = {
				// @ts-expect-error: micromark heavily relies on ambiend module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				type: TokenTypeMap.highlight,
				start: { ...events[j][1].start },
				end: { ...events[i][1].end },
			};

			// Text between highlight sequences.
			const text: Token = {
				// @ts-expect-error: micromark heavily relies on ambiend module declarations,
				//                   which Deno does not support. APIs also don't accept type parameters.
				type: TokenTypeMap.highlightText,
				// text starts at the end of opening sequence, and
				start: { ...events[j][1].end },
				// ends with at the start of closing sequence.
				end: { ...events[i][1].start },
			};

			// Initialize with opening events
			const nextEvents: Event[] = [
				["enter", highlight, context],
				["enter", events[j][1], context],
				["exit", events[j][1], context],
				["enter", text, context],
			];

			const insideSpan = context.parser.constructs.insideSpan.null;
			if (insideSpan) {
				// Resolve text? idk
				splice(
					nextEvents,
					nextEvents.length,
					0,
					resolveAll(insideSpan, events.slice(j + 1, i), context),
				);
			}

			// Append closing events to `nextEvents`
			splice(
				nextEvents,
				nextEvents.length,
				0,
				[
					["exit", text, context],
					["enter", events[i][1], context],
					["exit", events[i][1], context],
					["exit", highlight, context],
				],
			);

			// Replace part of original events with `nextEvents`
			splice(events, j - 1, i - j + 3, nextEvents);

			i = j + nextEvents.length - 2;
			break;
		}
	}

	for (const event of events) {
		// If there are temporary sequences left, alter them to `data` type.
		// (effectively making them invisible?, idk)
		// @ts-expect-error: micromark heavily relies on ambiend module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		if (event[1].type === TokenTypeMap.sequenceTemporary) {
			event[1].type = types.data;
		}
	}

	return events;
};

const construct: Construct = {
	name: "ofm-highlight",
	tokenize: tokenizer,
	resolveAll: resolver,
};
