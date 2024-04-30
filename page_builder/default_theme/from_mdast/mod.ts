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

import { buildClasses, css, join as joinCss } from "../css.ts";

import { calloutHandlers, calloutStyles } from "./callout.tsx";
import { listHandlers, listStyles } from "./list.tsx";
import { mathHandlers } from "./math.ts";
import { codeHandlers, codeStyles } from "./code.tsx";
import { linkHandlers, linkStyles } from "./link.tsx";
import { paragraphHandlers, paragraphStyles } from "./paragraph.ts";
import { quoteHandlers, quoteStyles } from "./quote.tsx";

const c = buildClasses("fm-0", ["wrapper"]);

const ownStyles = css`
	:where(.${c.wrapper}) sup,
	:where(.${c.wrapper}) sub {
		line-height: 1;
	}

	:where(.${c.wrapper}) s,
	:where(.${c.wrapper}) del {
		color: var(--color-fg-sub);
		text-decoration: line-through;
	}

	:where(.${c.wrapper}) b {
		font-weight: bold;
	}

	:where(.${c.wrapper}) i {
		font-style: italic;
	}

	:where(.${c.wrapper}) h1,
	:where(.${c.wrapper}) h2,
	:where(.${c.wrapper}) h3 {
		font-weight: 700;
		color: var(--color-fg-sub);
	}

	:where(.${c.wrapper}) h1 {
		margin: 0;
		margin-top: calc(var(--baseline) * 2rem);
		line-height: calc(var(--baseline) * 2rem);
	}

	:where(.${c.wrapper}) h2 {
		margin: 0;
		margin-top: calc(var(--baseline) * 2rem);
		line-height: calc(var(--baseline) * 1rem);
	}

	:where(.${c.wrapper}) h3,
	:where(.${c.wrapper}) h4,
	:where(.${c.wrapper}) h5,
	:where(.${c.wrapper}) h6 {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
		line-height: calc(var(--baseline) * 1rem);

		font-weight: 600;
	}

	:where(.${c.wrapper}) table {
		border-spacing: 0;
		margin: 0;
		margin-top: calc(var(--baseline) * 0.5rem);
		width: 100%;
	}

	:where(.${c.wrapper}) thead {
		background-color: var(--color-bg-accent);
	}

	:where(.${c.wrapper}) th {
		font-weight: 500;
		padding: calc(var(--baseline) * 0.25rem) 1em;
	}

	:where(.${c.wrapper}) td {
		padding: calc(var(--baseline) * 0.5rem) 1em;
	}

	:where(.${c.wrapper}) tbody td {
		position: relative;
	}

	:where(.${c.wrapper}) tbody td::after {
		content: "";
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		border-bottom: 1px solid var(--color-fg-light);
	}

	:where(.${c.wrapper}) hr {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
	}

	:where(.${c.wrapper}) img {
		max-width: 100%;
	}
	:where(.${c.wrapper}) img:not(:first-child) {
		margin-top: calc(var(--baseline) * 1rem);
	}

	:where(.${c.wrapper}) > math {
		display: block;
		margin-top: calc(var(--baseline) * 1rem);
	}

	@supports (display: math) {
		:where(.${c.wrapper}) > math {
			display: math;
			width: 100%;
		}
	}
`;

export const fromMdastStyles = joinCss(
	ownStyles,
	paragraphStyles,
	calloutStyles,
	listStyles,
	codeStyles,
	linkStyles,
	quoteStyles,
);

export function fromMdast(mdast: Mdast.Nodes): Hast.Nodes {
	return ofmHtml(toHast(mdast, {
		handlers: {
			...ofmToHastHandlers(),
			...calloutHandlers(),
			...listHandlers(),
			...mathHandlers(),
			...codeHandlers(),
			...linkHandlers(),
			...quoteHandlers(),
			...paragraphHandlers(),
		},
		allowDangerousHtml: true,
	}));
}

export function style(node: Hast.Nodes): Hast.Nodes {
	return h("div", { class: c.wrapper }, [node]);
}
