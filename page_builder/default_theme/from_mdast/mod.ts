// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Hast from "../../../deps/esm.sh/hast/types.ts";
import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";
import { h } from "../../../deps/esm.sh/hastscript/mod.ts";
import { toHast } from "../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import {
	ofmHtml,
	ofmToHastHandlers,
} from "../../../content_parser/obsidian_markdown.ts";

import { syntaxHighlightingHandlers } from "../mdast/syntax_highlighting_handlers.ts";

import { css, join as joinCss } from "../css.ts";

import { calloutHandlers, calloutStyles } from "./callout.tsx";
import { listHandlers, listStyles } from "./list.tsx";

const enum C {
	Wrapper = "fm--m",
}

const ownStyles = css`
	:where(.${C.Wrapper}) a {
		color: var(--color-fg-sub);
		font-weight: 500;
		text-decoration: underline;
		transition: color 0.15s ease;
	}

	:where(.${C.Wrapper}) a:hover {
		color: var(--color-primary);
	}

	:where(.${C.Wrapper}) p {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
	}

	:where(.${C.Wrapper}) pre {
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

	:where(.${C.Wrapper}) pre > code {
		all: unset;
	}

	:where(.${C.Wrapper}) code {
		margin: 0 0.2em;
		padding: calc(1rem / 4);

		background-color: var(--color-bg-accent);
		color: var(--color-fg-sub);
		border-radius: calc(1rem / 4);
		font-family: "Ubuntu Mono", monospace;
	}

	:where(.${C.Wrapper}) pre > code .token.comment {
		font-style: italic;
	}

	:where(.${C.Wrapper}) a,
	:where(.${C.Wrapper}) time,
	:where(.${C.Wrapper}) span,
	:where(.${C.Wrapper}) code,
	:where(.${C.Wrapper}) sup,
	:where(.${C.Wrapper}) small,
	:where(.${C.Wrapper}) s,
	:where(.${C.Wrapper}) b,
	:where(.${C.Wrapper}) i {
		line-height: 1;
	}

	:where(.${C.Wrapper}) button {
		font-family: inherit;
	}

	:where(.${C.Wrapper}) s,
	:where(.${C.Wrapper}) del {
		color: var(--color-fg-sub);
		text-decoration: line-through;
	}

	:where(.${C.Wrapper}) b {
		font-weight: bold;
	}

	:where(.${C.Wrapper}) i {
		font-style: italic;
	}

	:where(.${C.Wrapper}) ul {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
		padding-left: 1.5em;
	}

	:where(.${C.Wrapper}) ul ul {
		margin-top: 0;
	}

	:where(.${C.Wrapper}) h1,
	:where(.${C.Wrapper}) h2,
	:where(.${C.Wrapper}) h3 {
		font-weight: 700;
		color: var(--color-fg-sub);
	}

	:where(.${C.Wrapper}) h1 {
		margin: 0;
		margin-top: calc(var(--baseline) * 2rem);
		line-height: calc(var(--baseline) * 2rem);
	}

	:where(.${C.Wrapper}) h2 {
		margin: 0;
		margin-top: calc(var(--baseline) * 2rem);
	}

	:where(.${C.Wrapper}) h3,
	:where(.${C.Wrapper}) h4,
	:where(.${C.Wrapper}) h5,
	:where(.${C.Wrapper}) h6 {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);

		font-weight: 600;
	}

	:where(.${C.Wrapper}) table {
		border-spacing: 0;
		margin: 0;
		margin-top: calc(var(--baseline) * 0.5rem);
		width: 100%;
	}

	:where(.${C.Wrapper}) thead {
		background-color: var(--color-bg-accent);
	}

	:where(.${C.Wrapper}) th {
		font-weight: 500;
		padding: calc(var(--baseline) * 0.25rem) 1em;
	}

	:where(.${C.Wrapper}) td {
		padding: calc(var(--baseline) * 0.5rem) 1em;
	}

	:where(.${C.Wrapper}) tbody td {
		position: relative;
	}

	:where(.${C.Wrapper}) tbody td::after {
		content: "";
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		border-bottom: 1px solid var(--color-fg-light);
	}

	:where(.${C.Wrapper}) hr {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
	}

	:where(.${C.Wrapper}) img {
		max-width: 100%;
	}
	:where(.${C.Wrapper}) img:not(:first-child) {
		margin-top: calc(var(--baseline) * 1rem);
	}
`;

export const fromMdastStyles = joinCss(ownStyles, calloutStyles, listStyles);

export function fromMdast(mdast: Mdast.Nodes): Hast.Nodes {
	return ofmHtml(toHast(mdast, {
		handlers: {
			...ofmToHastHandlers(),
			...calloutHandlers(),
			...listHandlers(),
			...syntaxHighlightingHandlers(),
		},
		allowDangerousHtml: true,
	}));
}

export function style(node: Hast.Nodes): Hast.Nodes {
	return h("div", { class: C.Wrapper }, [node]);
}
