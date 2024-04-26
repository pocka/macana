// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";
import { h } from "../../../deps/esm.sh/hastscript/mod.ts";
import { type Handlers } from "../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { css, join } from "../css.ts";
import * as icons from "../icons/lucide.tsx";

const enum C {
	TaskItem = "fm-l--i",
	Checkbox = "fm-l--c",
	Check = "fm-l--h",
	Text = "fm-l--t",
}

export const listStyles = join(
	icons.lucideIconStyles,
	css`
	.${C.TaskItem} {
		display: flex;
		align-items: start;
		list-style: none;
	}

	.${C.Checkbox} {
		display: flex;
		align-items: stretch;
		justify-content: stretch;
		width: calc(1em - 2px);
		height: calc(1em - 2px);
		aspect-ratio: 1 / 1;
		border: 1px solid currentColor;
		margin: 0;
		margin-block-start: calc((var(--baseline) * 1rem - 1em) * 0.5 + 1px);
		margin-inline-start: calc(-1em - 2px);
		margin-inline-end: 4px;

		border-radius: 2px;
	}

	.${C.Check} {
		min-width: 0px;
		min-height: 0px;
		height: 100%;
	}

	.${C.Text} {
		line-height: calc(var(--baseline) * 1rem);
	}
`,
);

let counter = 0;

export function listHandlers(): Handlers {
	return {
		list(state, node: Mdast.List) {
			return h(node.ordered ? "ol" : "ul", {}, state.all(node));
		},
		listItem(state, node: Mdast.ListItem) {
			const children = state.all(node).map((child) =>
				child.type === "element" && child.tagName === "p"
					? child.children
					: [child]
			).flat();

			if (typeof node.checked !== "boolean") {
				return h("li", {}, children);
			}

			const labelId = "__macana_tcheck_lbl__" + (counter++).toString(16);

			return h("li", { class: C.TaskItem }, [
				<span
					class={C.Checkbox}
					role="checkbox"
					aria-disabled="true"
					tabindex="0"
					aria-checked={node.checked.toString()}
					aria-labelledby={labelId}
				>
					{node.checked
						? icons.check({ className: C.Check, "aria-hidden": "true" })
						: null}
				</span>,
				<span id={labelId} className={C.Text}>{children}</span>,
			]);
		},
	};
}
