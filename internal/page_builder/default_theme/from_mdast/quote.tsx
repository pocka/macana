// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../../../deps/esm.sh/mdast/types.ts";
import { h } from "../../../../deps/esm.sh/hastscript/mod.ts";
import { type Handlers } from "../../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { buildClasses, css } from "../css.ts";

const c = buildClasses("fm-q", [
	"quote",
]);

export const quoteStyles = css`
	.${c.quote} {
		margin: calc(var(--baseline) * 1rem) 0;
		padding: 0;
		padding-inline-start: 1em;
		font-size: 1rem;
		border-left: 0.25em solid var(--color-border);

		font-style: italic;

		opacity: 0.85;
	}
`;

export function quoteHandlers(): Handlers {
	return {
		blockquote(state, node: Mdast.Blockquote) {
			return h("blockquote", { class: c.quote }, state.all(node));
		},
	};
}
