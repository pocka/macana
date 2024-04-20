// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import type { Extension } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import type { State } from "../../deps/esm.sh/mdast-util-to-hast/mod.ts";
import type * as Hast from "../../deps/esm.sh/hast/types.ts";

export interface OfmComment extends Mdast.Node {
	type: "ofmComment";
	children: [OfmCommentBody];
}

export interface OfmCommentBody extends Mdast.Node {
	type: "ofmCommentBody";
	value: string;
}

export function ofmCommentFromMarkdown(): Extension {
	return {
		enter: {
			ofmInlineComment(token) {
				this.enter({
					// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
					//                   which Deno does not support. APIs also don't accept type parameters.
					type: "ofmComment",
					children: [],
				}, token);
			},
			ofmBlockComment(token) {
				this.enter({
					// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
					//                   which Deno does not support. APIs also don't accept type parameters.
					type: "ofmComment",
					children: [],
				}, token);
			},
			ofmCommentBody(token) {
				this.enter({
					// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
					//                   which Deno does not support. APIs also don't accept type parameters.
					type: "ofmCommentBody",
					children: [],
					value: this.sliceSerialize(token),
				}, token);
			},
		},
		exit: {
			ofmInlineComment(token) {
				this.exit(token);
			},
			ofmBlockComment(token) {
				this.exit(token);
			},
			ofmCommentBody(token) {
				this.exit(token);
			},
		},
	};
}

export interface OfmCommentToHastHandlersOptions {
	preserveAsHtmlComment?: boolean;
}

export function ofmCommentToHastHandlers(
	{ preserveAsHtmlComment = false }: OfmCommentToHastHandlersOptions = {},
) {
	if (!preserveAsHtmlComment) {
		return {
			ofmComment(): Hast.Nodes {
				return {
					type: "comment",
					value: "",
				};
			},
		};
	}

	return {
		ofmComment(_state: State, node: OfmComment): Hast.Nodes {
			const [body] = node.children;
			if (!body) {
				return {
					type: "comment",
					value: "",
				};
			}

			return {
				type: "comment",
				value: body.value,
			};
		},
	};
}
