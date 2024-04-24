// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { css } from "../css.ts";

export const globalStyles = css`
	/* Variables */
	:root {
		font-size: 1em;

		--baseline: 1.75;
		line-height: var(--baseline);

		--color-primary: rgb(217, 59, 133);

		--color-bg: #fafafa;
		--color-bg-accent: #eaeaea;
		--color-fg: #333;
		--color-fg-sub: #534c37;
		--color-fg-light: #c5c5c5;
		--color-border: #b4af9d;
		--color-subtle-overlay: hsl(0deg 0% 0% / 0.035);
		color: var(--color-fg);

		--obsidian-color-red: #e03131;
		--obsidian-color-blue: #4c6ef5;
		--obsidian-color-orange: #e03131;
		--obsidian-color-yellow: #fcc419;
		--obsidian-color-green: #2f9e44;
		--obsidian-color-cyan: #22b8cf;
		--obsidian-color-purple: #ae3ec9;
		--obsidian-color-fallback: #adb5bd;

		--canvas-color-red: var(--obsidian-color-red);
		--canvas-color-orange: var(--obsidian-color-orange);
		--canvas-color-yellow: var(--obsidian-color-yellow);
		--canvas-color-green: var(--obsidian-color-green);
		--canvas-color-cyan: var(--obsidian-color-cyan);
		--canvas-color-purple: var(--obsidian-color-purple);
		--canvas-color-fallback: var(--obsidian-color-fallback);

		--callout-color-info: var(--obsidian-color-blue);
		--callout-color-todo: var(--obsidian-color-blue);
		--callout-color-tip: var(--obsidian-color-cyan);
		--callout-color-success: var(--obsidian-color-green);
		--callout-color-question: var(--obsidian-color-yellow);
		--callout-color-warning: var(--obsidian-color-yellow);
		--callout-color-failure: var(--obsidian-color-red);
		--callout-color-danger: var(--obsidian-color-red);
		--callout-color-bug: var(--obsidian-color-red);
		--callout-color-example: var(--obsidian-color-purple);
		--callout-color-quote: var(--obsidian-color-fallback);

		--canvas-node-bg-opacity: 0.05;
		--canvas-node-stroke-width: 2px;
		--canvas-edge-stroke-width: 6px;
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--color-bg: #222228;
			--color-bg-accent: #323135;
			--color-fg: #fafafa;
			--color-fg-sub: #f3edd9;
			--color-fg-light: #c5c5c5;
			--color-border: #b4af9d;
			--color-subtle-overlay: hsl(0deg 0% 100% / 0.1);

			--canvas-node-bg-opacity: 0.1;
		}
	}

	/* Elements */
	html {
		font-family: "Inter", sans-serif;
	}

	html[lang="ja"] {
		font-family: "Inter", "Noto Sans JP", sans-serif;
	}

	body {
		margin: 0;
		line-height: calc(var(--baseline) * 1rem);

		background: var(--color-bg);
	}

	*,
	::before,
	::after {
		box-sizing: border-box;
	}

	a {
		color: var(--color-fg-sub);
		font-weight: 500;
		text-decoration: underline;
		transition: color 0.15s ease;
	}

	a:hover {
		color: var(--color-primary);
	}

	p {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
	}

	pre {
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

	pre > code {
		all: unset;
	}

	code {
		margin: 0 0.2em;
		padding: calc(1rem / 4);

		background-color: var(--color-bg-accent);
		color: var(--color-fg-sub);
		border-radius: calc(1rem / 4);
		font-family: "Ubuntu Mono", monospace;
	}

	pre > code .token.comment {
		font-style: italic;
	}

	a,
	time,
	span,
	code,
	sup,
	small,
	s,
	b,
	i {
		line-height: 1;
	}

	button {
		font-family: inherit;
	}

	s,
	del {
		color: var(--color-fg-sub);
		text-decoration: line-through;
	}

	b {
		font-weight: bold;
	}

	i {
		font-style: italic;
	}

	ul {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
		padding-left: 1.5em;
	}

	ul ul {
		margin-top: 0;
	}

	h1,
	h2,
	h3 {
		font-weight: 700;
		color: var(--color-fg-sub);
	}

	h1 {
		margin: 0;
		margin-top: calc(var(--baseline) * 2rem);
		line-height: calc(var(--baseline) * 2rem);
	}

	h2 {
		margin: 0;
		margin-top: calc(var(--baseline) * 2rem);
	}

	h3,
	h4,
	h5,
	h6 {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);

		font-weight: 600;
	}

	table {
		border-spacing: 0;
		margin: 0;
		margin-top: calc(var(--baseline) * 0.5rem);
		width: 100%;
	}

	thead {
		background-color: var(--color-bg-accent);
	}

	th {
		font-weight: 500;
		padding: calc(var(--baseline) * 0.25rem) 1em;
	}

	td {
		padding: calc(var(--baseline) * 0.5rem) 1em;
	}

	tbody td {
		position: relative;
	}

	tbody td::after {
		content: "";
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		border-bottom: 1px solid var(--color-fg-light);
	}

	h1:hover > a[data-hash-link],
	h2:hover > a[data-hash-link],
	h3:hover > a[data-hash-link],
	h4:hover > a[data-hash-link],
	h5:hover > a[data-hash-link],
	h6:hover > a[data-hash-link] {
		opacity: 1;
	}

	a[data-hash-link] {
		display: inline-block;
		margin-left: -1em;
		padding-right: 0.3em;

		text-decoration: none;

		opacity: 0;
	}
	a[data-hash-link]:hover {
		text-decoration: underline;
	}
	a[data-hash-link]:focus {
		opacity: 1;
	}

	img {
		max-width: 100%;
	}
	img:not(:first-child) {
		margin-top: calc(var(--baseline) * 1rem);
	}

	hr {
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
	}

	/* Syntax highlight */
	.macana--highlight [data-hl-node~="token"][data-hl-node~="content"] {
		color: var(--color-bg);
	}
	.macana--highlight [data-hl-node~="token"][data-hl-node~="punctuation"] {
		color: #ccc;
	}

	@media (prefers-color-scheme: dark) {
		.macana--highlight [data-hl-node~="token"][data-hl-node~="punctuation"] {
			color: #888;
		}
	}
`;
