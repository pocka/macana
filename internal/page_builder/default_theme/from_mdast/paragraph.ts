// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../../../deps/npm/mdast/types.ts";
import { h } from "../../../../deps/npm/hastscript/mod.ts";
import { type Handlers } from "../../../../deps/npm/mdast-util-to-hast/mod.ts";

import { buildClasses, css } from "../css.ts";

import { getRequestedId } from "./utils.ts";

const c = buildClasses("fm-p", ["paragraph"]);

export const paragraphStyles = css`
	.${c.paragraph} {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
		font-size: 1rem;
		line-height: calc(var(--baseline) * 1rem);
	}
`;

export function paragraphHandlers(): Handlers {
	return {
		paragraph(state, node: Mdast.Paragraph) {
			const id = getRequestedId(node) ?? undefined;

			return h("p", { id, class: c.paragraph }, state.all(node));
		},
	};
}
