// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import type * as Hast from "../../../deps/esm.sh/hast/types.ts";
import { h } from "../../../deps/esm.sh/hastscript/mod.ts";
import {
	type Handlers,
	type State,
} from "../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import {
	type CalloutType,
	type OfmCallout,
	parseOfmCalloutNode,
} from "../../../content_parser/obsidian_markdown/mdast_util_ofm_callout.ts";

import { css, join } from "../css.ts";
import * as icons from "../icons/lucide.tsx";

const enum C {
	Root = "fm-co--root",
	Title = "fm-co--title",
	TitleText = "fm-co--tt",
	Body = "fm-co--b",
	Icon = "fm-co--i",
	Bg = "fm-co--g",
	Chevron = "fm-co--c",
}

export const calloutStyles = join(
	icons.lucideIconStyles,
	css`
	.${C.Root} {
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
	.${C.Root}[data-type="todo"] {
		--_macana-callout-color: var(--callout-color-todo);
	}
	.${C.Root}[data-type="tip"] {
		--_macana-callout-color: var(--callout-color-tip);
	}
	.${C.Root}[data-type="success"] {
		--_macana-callout-color: var(--callout-color-success);
	}
	.${C.Root}[data-type="question"] {
		--_macana-callout-color: var(--callout-color-question);
	}
	.${C.Root}[data-type="warning"] {
		--_macana-callout-color: var(--callout-color-warning);
	}
	.${C.Root}[data-type="failure"] {
		--_macana-callout-color: var(--callout-color-failure);
	}
	.${C.Root}[data-type="danger"] {
		--_macana-callout-color: var(--callout-color-danger);
	}
	.${C.Root}[data-type="bug"] {
		--_macana-callout-color: var(--callout-color-bug);
	}
	.${C.Root}[data-type="example"] {
		--_macana-callout-color: var(--callout-color-example);
	}
	.${C.Root}[data-type="quote"] {
		--_macana-callout-color: var(--callout-color-quote);
	}

	.${C.Bg} {
		position: absolute;
		inset: 0;

		background-color: var(--_macana-callout-color);
		pointer-events: none;

		opacity: 0.02;
	}

	@media (prefers-color-scheme: dark) {
		.${C.Root} {
			--_macana-callout-overlay: hsl(0deg 0% 100% / 0.1);
		}

		.${C.Bg} {
			opacity: 0.05;
		}
	}

	.${C.Title} {
		font-size: 1.1rem;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 0.25em;
		padding: calc(var(--baseline) * 0.5rem) 8px;
		border-bottom: 1px solid var(--_macana-callout-overlay);

		margin-top: 0;
		font-weight: 700;
	}
	summary.${C.Title} {
		cursor: pointer;
	}
	summary.${C.Title}:hover {
		background-color: var(--_macana-callout-overlay);
	}
	details:not([open]) > summary.${C.Title} {
		border-bottom-color: transparent;
	}

	.${C.Icon} {
		color: var(--_macana-callout-color);
	}

	.${C.TitleText} {
		line-height: calc(var(--baseline) * 1rem);
	}

	.${C.Chevron} {
		transition: transform 0.15s ease-out;
	}
	details:not([open]) .${C.Chevron} {
		transform: rotate(-90deg);
	}

	.${C.Body} {
		font-size: 1rem;

		padding: calc(var(--baseline) * 0.5rem) 12px;
	}
	.${C.Body} > :first-child {
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
				class: C.Root,
				"aria-labelledby": titleId,
				"data-type": type,
			};

			if (!node.isFoldable) {
				return (
					<aside
						{...containerProps}
					>
						<div class={C.Bg} />
						<p class={C.Title} id={titleId}>
							{icon(type, C.Icon)}
							<span class={C.TitleText}>{title}</span>
						</p>
						<div class={C.Body}>{body}</div>
					</aside>
				);
			}

			return (
				<aside {...containerProps}>
					<div class={C.Bg} />
					<details open={node.defaultExpanded ? "" : undefined}>
						<summary class={C.Title} id={titleId}>
							{icon(type, C.Icon)}
							<span class={C.TitleText}>{title}</span>
							{icons.chevronDown({
								className: C.Chevron,
								"aria-hidden": "true",
							})}
						</summary>
						<div class={C.Body}>{body}</div>
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
