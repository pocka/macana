// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h, type Result } from "../../../deps/esm.sh/hastscript/mod.ts";

import type { BuildContext } from "../context.ts";
import { buildClasses, css } from "../css.ts";

const c = buildClasses("w-l", [
	"layout",
	"headerBg",
	"header",
	"logo",
	"logoLink",
	"nav",
	"navInner",
	"footerBg",
	"footer",
	"main",
	"aside",
	"asideInner",
]);

export const layoutStyles = css`
	.${c.layout} {
		--_ends-shadow-color: hsl(0deg 0% 0% / 0.03);

		display: grid;
		grid-template-columns: minmax(100vw, 1fr);
		min-height: 100vh;
	}

	.${c.layout} > * {
    padding: calc(var(--baseline) * 1rem) 16px;
	}

  .${c.layout} > * > :first-child {
    margin-block-start: 0;
  }

	.${c.headerBg}, .${c.header} {
		padding: calc(var(--baseline) * 0.5rem) 16px;
	}

	.${c.headerBg} {
		position: sticky;
		top: calc(var(--baseline) * -1rem);
		grid-row: 1;
		grid-column: 1 / -1;
		margin-block-end: calc(var(--baseline) * 2rem);
		border-block-end: 1px solid var(--_ends-shadow-color);

		background-color: var(--color-bg-accent);
	}

	.${c.header} {
		grid-row: 1;
		grid-column: 1;
		margin-block-end: calc(var(--baseline) * 2rem);
		display: flex;
		position: sticky;
		top: calc(var(--baseline) * -0.5rem);
	}

	.${c.logoLink} {
		display: flex;

		border-radius: 4px;
	}
	.${c.logoLink}:hover {
		background-color: var(--color-subtle-overlay);
	}

	.${c.logo} {
		padding: 4px;
	}

	.${c.nav} {
		grid-column: 1;
	}

	.${c.navInner}, .${c.asideInner} {
		position: sticky;
		top: calc(var(--baseline) * 1rem);
	}

	@media (hover: hover) {
		.${c.navInner}, .${c.asideInner} {
			opacity: 0.7;
			transition: opacity 8s ease;
		}

		.${c.navInner}:hover,
		.${c.navInner}:focus-within,
		.${c.asideInner}:hover,
		.${c.asideInner}:focus-within {
			opacity: 1;
			transition-duration: 0.2s;
		}
	}

	.${c.main} {
		grid-column: 1 / -1;
	}

	.${c.aside} {
		grid-column: 1 / -1;
	}

	.${c.footerBg} {
		grid-row: 999;
		grid-column: 1 / -1;
		margin-block-start: calc(var(--baseline) * 2rem);
		border-block-start: 1px solid var(--_ends-shadow-color);

		background-color: var(--color-bg-accent);
	}

	.${c.footer} {
		grid-row: 999;
		grid-column: 1;
		margin-block-start: calc(var(--baseline) * 2rem);

		color: var(--color-fg-sub);
	}

  @media (min-width: 700px) {
    .${c.layout} {
      grid-template-columns: 200px minmax(0, 1fr);
    }

    .${c.header}, .${c.footer} {
      grid-column: 1 / -1;
    }
  }

  @media (min-width: 1000px) {
    .${c.layout} {
      grid-template-columns: 1fr min(700px, 100%) 1fr;
    }

    .${c.main}, .${c.header}, .${c.footer} {
      grid-column: 2;
    }

		.${c.aside} {
			grid-column: 3;
		}

		.${c.navInner}, .${c.asideInner} {
			margin-inline-start: auto;
      margin-inline-end: 0;
			max-width: 400px;
		}
  }
`;

export interface LayoutProps {
	/**
	 * Site navigation content.
	 */
	nav: Result;

	aside?: Result;

	/**
	 * Content shown inside `<main>`.
	 */
	main: Result;

	footer: Result;
}

export function layout({
	nav,
	aside,
	main,
	footer,
}: LayoutProps, ctx: BuildContext) {
	const { assets, resolvePath, documentTree: { defaultDocument } } = ctx;

	return (
		<div class={c.layout}>
			<div class={c.headerBg} />
			{assets.siteLogo && (
				<header class={c.header}>
					<a
						class={c.logoLink}
						href={resolvePath([...defaultDocument.path, ""]).join("/")}
						title={defaultDocument.metadata.title}
						lang={defaultDocument.metadata.language}
					>
						<img
							class={c.logo}
							src={resolvePath(assets.siteLogo).join("/")}
							width={32}
							height={32}
						/>
					</a>
				</header>
			)}
			<nav class={c.nav}>
				<div class={c.navInner}>{nav}</div>
			</nav>
			<main class={c.main}>{main}</main>
			{aside && (
				<aside class={c.aside}>
					<div class={c.asideInner}>{aside}</div>
				</aside>
			)}
			<div class={c.footerBg} />
			<footer class={c.footer}>{footer}</footer>
		</div>
	);
}
