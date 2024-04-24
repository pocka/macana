// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */
/** @jsxFrag Fragment */

import type * as Hast from "../../../../deps/esm.sh/hast/types.ts";
import type * as Mdast from "../../../../deps/esm.sh/mdast/types.ts";
import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";
import * as jsxRuntime from "../../../../deps/deno.land/x/nano_jsx/jsx-runtime/index.ts";
import { toJsxRuntime } from "../../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";
import * as HastToJSXRuntime from "../../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";
import {
	type State,
	toHast,
} from "../../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import {
	ofmHtml,
	ofmToHastHandlers,
} from "../../../../content_parser/obsidian_markdown.ts";
import { parseOfmCalloutNode } from "../../../../content_parser/obsidian_markdown/mdast_util_ofm_callout.ts";
import { syntaxHighlightingHandlers } from "../../mdast/syntax_highlighting_handlers.ts";

import { css, join as joinCss } from "../../css.ts";
import * as callout from "../from-hast/callout.tsx";

const enum C {
	Wrapper = "a--hr",
}

const ownStyles = css`
	.${C.Wrapper} a {
		color: var(--color-fg-sub);
		font-weight: 500;
		text-decoration: underline;
		transition: color 0.15s ease;
	}

	.${C.Wrapper} a:hover {
		color: var(--color-primary);
	}

	.${C.Wrapper} p {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
	}

	.${C.Wrapper} pre {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem) !important;
		padding: calc(var(--baseline) * 1rem) 1em !important;
		line-height: calc(var(--baseline) * 1rem);
		max-width: 100%;
		font-size: 1rem;

		background-color: var(--color-fg);
		color: var(--color-bg);
		border-radius: calc(1rem / 4);
		overflow-x: auto;
	}

	.${C.Wrapper} pre > code {
		all: unset;
	}

	.${C.Wrapper} code {
		margin: 0 0.2em;
		padding: calc(1rem / 4);

		background-color: var(--color-bg-accent);
		color: var(--color-fg-sub);
		border-radius: calc(1rem / 4);
		font-family: "Ubuntu Mono", monospace;
	}

	.${C.Wrapper} pre > code .token.comment {
		font-style: italic;
	}

	.${C.Wrapper} a,
	.${C.Wrapper} time,
	.${C.Wrapper} span,
	.${C.Wrapper} code,
	.${C.Wrapper} sup,
	.${C.Wrapper} small,
	.${C.Wrapper} s,
	.${C.Wrapper} b,
	.${C.Wrapper} i {
		line-height: 1;
	}

	.${C.Wrapper} button {
		font-family: inherit;
	}

	.${C.Wrapper} s,
	.${C.Wrapper} del {
		color: var(--color-fg-sub);
		text-decoration: line-through;
	}

	.${C.Wrapper} b {
		font-weight: bold;
	}

	.${C.Wrapper} i {
		font-style: italic;
	}

	.${C.Wrapper} ul {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
		padding-left: 1.5em;
	}

	.${C.Wrapper} ul ul {
		margin-top: 0;
	}

	.${C.Wrapper} h1,
	.${C.Wrapper} h2,
	.${C.Wrapper} h3 {
		font-weight: 700;
		color: var(--color-fg-sub);
	}

	.${C.Wrapper} h1 {
		margin: 0;
		margin-top: calc(var(--baseline) * 2rem);
		line-height: calc(var(--baseline) * 2rem);
	}

	.${C.Wrapper} h2 {
		margin: 0;
		margin-top: calc(var(--baseline) * 2rem);
	}

	.${C.Wrapper} h3,
	.${C.Wrapper} h4,
	.${C.Wrapper} h5,
	.${C.Wrapper} h6 {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);

		font-weight: 600;
	}

	.${C.Wrapper} table {
		border-spacing: 0;
		margin: 0;
		margin-top: calc(var(--baseline) * 0.5rem);
		width: 100%;
	}

	.${C.Wrapper} thead {
		background-color: var(--color-bg-accent);
	}

	.${C.Wrapper} th {
		font-weight: 500;
		padding: calc(var(--baseline) * 0.25rem) 1em;
	}

	.${C.Wrapper} td {
		padding: calc(var(--baseline) * 0.5rem) 1em;
	}

	.${C.Wrapper} tbody td {
		position: relative;
	}

	.${C.Wrapper} tbody td::after {
		content: "";
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		border-bottom: 1px solid var(--color-fg-light);
	}

	.${C.Wrapper} hr {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
	}

	.${C.Wrapper} img {
		max-width: 100%;
	}
	.${C.Wrapper} img:not(:first-child) {
		margin-top: calc(var(--baseline) * 1rem);
	}
`;

export const styles = joinCss(ownStyles, callout.styles);

function nanoifyProps(props: HastToJSXRuntime.Props): HastToJSXRuntime.Props {
	const ret: HastToJSXRuntime.Props = {};

	for (const key in props) {
		switch (props[key]) {
			// nanojsx cannot handle falsy attribute correctly
			case false:
			case null:
				break;
			// ideal `true` for boolean attribute is empty string, but nanojsx emits `"true"`.
			case true:
				ret[key] = "";
				break;
			default:
				ret[key] = props[key];
				break;
		}
	}

	return ret;
}

export function render(hast: Hast.Nodes, wrapAndStyle: boolean = true) {
	return toJsxRuntime(hast, {
		components: wrapAndStyle
			? {
				"macana-ofm-callout": callout.MacanaOfmCallout,
				"macana-ofm-callout-title": callout.MacanaOfmCalloutTitle,
				"macana-ofm-callout-body": callout.MacanaOfmCalloutBody,
			}
			: {},
		Fragment: jsxRuntime.Fragment,
		jsx(type, props, key) {
			return jsxRuntime.jsx(type, nanoifyProps(props), key || "");
		},
		jsxs(type, props, key) {
			return jsxRuntime.jsxs(type, nanoifyProps(props), key || "");
		},
	});
}

export function mdastToHast(input: Mdast.Nodes): Hast.Nodes {
	return ofmHtml(toHast(input, {
		handlers: {
			...ofmToHastHandlers({
				callout: {
					generateIcon(type) {
						return {
							type: "element",
							tagName: "macana-ofm-callout-icon",
							properties: {
								type,
							},
							children: [],
						};
					},
				},
			}),
			// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			ofmCallout(state: State, node: OfmCallout): Hast.Nodes {
				const { title, body, type } = parseOfmCalloutNode(state, node);

				return {
					type: "element",
					tagName: "macana-ofm-callout",
					properties: {
						type: type,
						foldable: node.isFoldable,
						defaultExpanded: node.defaultExpanded,
					},
					children: [
						{
							type: "element",
							tagName: "macana-ofm-callout-title",
							properties: {},
							children: title,
						},
						{
							type: "element",
							tagName: "macana-ofm-callout-body",
							properties: {},
							children: body,
						},
					],
				};
			},
			...syntaxHighlightingHandlers(),
		},
		allowDangerousHtml: true,
	}));
}

export interface ViewProps {
	node: Hast.Nodes;

	wrapAndStyle?: boolean;
}

export function View({ node, wrapAndStyle = true }: ViewProps) {
	if (!wrapAndStyle) {
		return render(node);
	}

	return (
		<div className={C.Wrapper}>
			{render(node)}
		</div>
	);
}
