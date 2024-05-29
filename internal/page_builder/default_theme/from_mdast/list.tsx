// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import type * as Mdast from "../../../../deps/esm.sh/mdast/types.ts";
import { h } from "../../../../deps/esm.sh/hastscript/mod.ts";
import { type Handlers } from "../../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { buildClasses, css, join } from "../css.ts";
import * as icons from "../icons/lucide.tsx";

const c = buildClasses("fm-l", [
	"taskItem",
	"checkbox",
	"check",
	"text",
	"list",
	"normalListItem",
]);

export const listStyles = join(
	icons.lucideIconStyles,
	css`
	.${c.list} {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
		padding-left: 1.5em;
		line-height: calc(var(--baseline) * 1rem);
	}
	.${c.list} .${c.list} {
		margin-top: 0;
	}

	.${c.text} {
		line-height: calc(var(--baseline) * 1rem);
	}

	.${c.taskItem} {
		display: flex;
		align-items: start;
		list-style: none;
	}

	.${c.checkbox} {
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

	.${c.check} {
		min-width: 0px;
		min-height: 0px;
		height: 100%;
	}

	.${c.normalListItem}::marker {
		line-height: 1.5;
	}
`,
);

let counter = 0;

export function listHandlers(): Handlers {
	return {
		list(state, node: Mdast.List) {
			return h(node.ordered ? "ol" : "ul", { class: c.list }, state.all(node));
		},
		listItem(state, node: Mdast.ListItem) {
			const children = state.all(node).map((child) =>
				child.type === "element" && child.tagName === "p"
					? child.children
					: [child]
			).flat();

			if (typeof node.checked !== "boolean") {
				return h("li", { class: c.normalListItem }, children);
			}

			const labelId = "__macana_tcheck_lbl__" + (counter++).toString(16);

			return h("li", { class: c.taskItem }, [
				<span
					class={c.checkbox}
					role="checkbox"
					aria-disabled="true"
					tabindex="0"
					aria-checked={node.checked.toString()}
					aria-labelledby={labelId}
				>
					{node.checked
						? icons.check({ className: c.check, "aria-hidden": "true" })
						: null}
				</span>,
				<span id={labelId} className={c.text}>{children}</span>,
			]);
		},
	};
}
