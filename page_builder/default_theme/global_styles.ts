// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { css } from "./css.ts";

export const globalStyles = css`
	/* Variables */
	:root {
		font-size: 1em;

		--baseline: 1.75;
		line-height: var(--baseline);

		--color-primary: rgb(217, 59, 133);

		--color-bg: hsl(0deg 0% 98%);
		--color-bg-accent: hsl(0deg 0% 95%);
		--color-bg-light: hsl(60deg 4% 96%);
		--color-fg: #333;
		--color-fg-sub: #534c37;
		--color-fg-light: #c5c5c5;
		--color-border: hsl(47deg 13% 66% / 0.3);
		--color-subtle-overlay: hsl(0deg 0% 0% / 0.035);
		color: var(--color-fg);

		--obsidian-color-red: #e03131;
		--obsidian-color-blue: #4c6ef5;
		--obsidian-color-orange: #f76707;
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
			--color-bg: hsl(240deg 8% 15%);
			--color-bg-accent: hsl(250deg 3% 17%);
			--color-bg-light: hsl(245deg 2% 16%);
			--color-fg: #fafafa;
			--color-fg-sub: #f3edd9;
			--color-fg-light: #c5c5c5;
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
`;
