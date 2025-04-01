// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import type * as Hast from "../../../../deps/npm/hast/types.ts";
import { h } from "../../../../deps/npm/hastscript/mod.ts";
import {
	type Handlers,
	type State,
} from "../../../../deps/npm/mdast-util-to-hast/mod.ts";

import {
	type CalloutType,
	type OfmCallout,
	parseOfmCalloutNode,
} from "../../../../lib/mdast_util_ofm_callout/mod.ts";

import { buildClasses, css, join } from "../css.ts";
import * as icons from "../icons/lucide.tsx";

const c = buildClasses("fm-co", [
	"root",
	"title",
	"titleText",
	"body",
	"icon",
	"bg",
	"chevron",
]);

export const calloutStyles = join(
	icons.lucideIconStyles,
	css`
	.${c.root} {
		--_macana-callout-overlay: hsl(0deg 0% 0% / 0.03);
		--_macana-callout-color: var(--callout-color-info, var(--obsidian-color-fallback));

		position: relative;
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
		padding: 0;
		line-height: calc(var(--baseline) * 1rem);
		max-width: 100%;
		font-size: 1rem;
		border: 1px solid var(--_macana-callout-color);

		border-radius: 4px;
	}
	.${c.root}[data-type="todo"] {
		--_macana-callout-color: var(--callout-color-todo);
	}
	.${c.root}[data-type="tip"] {
		--_macana-callout-color: var(--callout-color-tip);
	}
	.${c.root}[data-type="success"] {
		--_macana-callout-color: var(--callout-color-success);
	}
	.${c.root}[data-type="question"] {
		--_macana-callout-color: var(--callout-color-question);
	}
	.${c.root}[data-type="warning"] {
		--_macana-callout-color: var(--callout-color-warning);
	}
	.${c.root}[data-type="failure"] {
		--_macana-callout-color: var(--callout-color-failure);
	}
	.${c.root}[data-type="danger"] {
		--_macana-callout-color: var(--callout-color-danger);
	}
	.${c.root}[data-type="bug"] {
		--_macana-callout-color: var(--callout-color-bug);
	}
	.${c.root}[data-type="example"] {
		--_macana-callout-color: var(--callout-color-example);
	}
	.${c.root}[data-type="quote"] {
		--_macana-callout-color: var(--callout-color-quote);
	}

	.${c.bg} {
		position: absolute;
		inset: 0;

		background-color: var(--_macana-callout-color);
		pointer-events: none;

		opacity: 0.02;
	}

	@media (prefers-color-scheme: dark) {
		.${c.root} {
			--_macana-callout-overlay: hsl(0deg 0% 100% / 0.1);
		}

		.${c.bg} {
			opacity: 0.05;
		}
	}

	.${c.title} {
		font-size: 1.1rem;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 0.25em;
		padding: calc(var(--baseline) * 0.5rem) 8px;
		border-bottom: 1px solid var(--_macana-callout-overlay);

		margin: 0;
		font-weight: 700;
	}
	summary.${c.title} {
		cursor: pointer;
	}
	summary.${c.title}::-webkit-details-marker {
		display: none;
	}
	summary.${c.title}:hover {
		background-color: var(--_macana-callout-overlay);
	}
	details:not([open]) > summary.${c.title} {
		border-bottom-color: transparent;
	}

	.${c.icon} {
		color: var(--_macana-callout-color);
	}

	.${c.titleText} {
		line-height: calc(var(--baseline) * 1rem);
	}

	.${c.chevron} {
		transition: transform 0.15s ease-out;
	}
	details:not([open]) .${c.chevron} {
		transform: rotate(-90deg);
	}

	.${c.body} {
		font-size: 1rem;

		padding: calc(var(--baseline) * 0.5rem) 12px;
	}
	.${c.body} > :first-child {
		margin-block-start: 0;
	}
`,
);

let counter = 0;

export function calloutHandlers(): Handlers {
	return {
		// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		ofmCallout(state: State, node: OfmCallout): Hast.Nodes {
			const { title, body, type } = parseOfmCalloutNode(state, node);

			const titleId = "__macana-callout__" + (counter++).toString(16);

			const containerProps = {
				class: c.root,
				"aria-labelledby": titleId,
				"data-type": type,
			};

			if (!node.isFoldable) {
				return (
					<aside
						{...containerProps}
					>
						<div class={c.bg} />
						<p class={c.title} id={titleId}>
							{icon(type, c.icon)}
							<span class={c.titleText}>{title}</span>
						</p>
						<div class={c.body}>{body}</div>
					</aside>
				);
			}

			return (
				<aside {...containerProps}>
					<div class={c.bg} />
					<details open={node.defaultExpanded ? "" : undefined}>
						<summary class={c.title} id={titleId}>
							{icon(type, c.icon)}
							<span class={c.titleText}>{title}</span>
							{icons.chevronDown({
								className: c.chevron,
								"aria-hidden": "true",
							})}
						</summary>
						<div class={c.body}>{body}</div>
					</details>
				</aside>
			);
		},
	};
}

function icon(type: CalloutType, className?: string) {
	switch (type) {
		case "abstract":
			return icons.clipboardList({
				className,
				role: "img",
				"aria-label": "Clipboard icon",
			});
		case "info":
			return icons.info({
				className,
				role: "img",
				"aria-label": "Info icon",
			});
		case "todo":
			return icons.circleCheck({
				className,
				role: "img",
				"aria-label": "Check icon",
			});
		case "tip":
			return icons.flame({
				className,
				role: "img",
				"aria-label": "Flame icon",
			});
		case "success":
			return icons.check({
				className,
				role: "img",
				"aria-label": "Check icon",
			});
		case "question":
			return icons.circleHelp({
				className,
				role: "img",
				"aria-label": "Question icon",
			});
		case "warning":
			return icons.triangleAlert({
				className,
				role: "img",
				"aria-label": "Warning icon",
			});
		case "failure":
			return icons.x({
				className,
				role: "img",
				"aria-label": "Cross icon",
			});
		case "danger":
			return icons.zap({
				className,
				role: "img",
				"aria-label": "Lightning icon",
			});
		case "bug":
			return icons.bug({
				className,
				role: "img",
				"aria-label": "Bug icon",
			});
		case "example":
			return icons.list({
				className,
				role: "img",
				"aria-label": "List icon",
			});
		case "quote":
			return icons.quote({
				className,
				role: "img",
				"aria-label": "Quote icon",
			});
		case "note":
		default:
			return icons.pencil({
				className,
				role: "img",
				"aria-label": "Pencil icon",
			});
	}
}
