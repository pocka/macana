// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h, type Result } from "../../../deps/esm.sh/hastscript/mod.ts";
import type * as Hast from "../../../deps/esm.sh/hast/types.ts";

import type { BuildContext } from "../context.ts";
import { css } from "../css.ts";

const enum C {
	Layout = "w-l--root",
	HeaderBg = "w-l--headbg",
	Header = "w-l--head",
	Logo = "w-l--lg",
	LogoLink = "w-l--ll",
	Nav = "w-l--nav",
	NavInner = "w-l--nav-i",
	FooterBg = "w-l--fbg",
	Footer = "w-l--foot",
	Main = "w-l--main",
	Aside = "w-l--aside",
	AsideInner = "w-l--aside-i",
}

export const layoutStyles = css`
	.${C.Layout} {
		--_ends-shadow-color: hsl(0deg 0% 0% / 0.03);

		display: grid;
		grid-template-columns: minmax(100vw, 1fr);
		min-height: 100vh;
	}

	.${C.Layout} > * {
    padding: calc(var(--baseline) * 1rem) 16px;
	}

  .${C.Layout} > * > :first-child {
    margin-block-start: 0;
  }

	.${C.HeaderBg}, .${C.Header} {
		padding: calc(var(--baseline) * 0.5rem) 16px;
	}

	.${C.HeaderBg} {
		position: sticky;
		top: calc(var(--baseline) * -1rem);
		grid-row: 1;
		grid-column: 1 / -1;
		margin-block-end: calc(var(--baseline) * 2rem);
		border-block-end: 1px solid var(--_ends-shadow-color);

		background-color: var(--color-bg-accent);
	}

	.${C.Header} {
		grid-row: 1;
		grid-column: 1;
		margin-block-end: calc(var(--baseline) * 2rem);
		display: flex;
		position: sticky;
		top: calc(var(--baseline) * -0.5rem);
	}

	.${C.LogoLink} {
		display: flex;

		border-radius: 4px;
	}
	.${C.LogoLink}:hover {
		background-color: var(--color-subtle-overlay);
	}

	.${C.Logo} {
		padding: 4px;
	}

	.${C.Nav} {
		grid-column: 1;
	}

	.${C.NavInner}, .${C.AsideInner} {
		position: sticky;
		top: calc(var(--baseline) * 1rem);
	}

	@media (hover: hover) {
		.${C.NavInner}, .${C.AsideInner} {
			opacity: 0.7;
			transition: opacity 8s ease;
		}

		.${C.NavInner}:hover,
		.${C.NavInner}:focus-within,
		.${C.AsideInner}:hover,
		.${C.AsideInner}:focus-within {
			opacity: 1;
			transition-duration: 0.2s;
		}
	}

	.${C.Main} {
		grid-column: 1 / -1;
	}

	.${C.Aside} {
		grid-column: 1 / -1;
	}

	.${C.FooterBg} {
		grid-row: 999;
		grid-column: 1 / -1;
		margin-block-start: calc(var(--baseline) * 2rem);
		border-block-start: 1px solid var(--_ends-shadow-color);

		background-color: var(--color-bg-accent);
	}

	.${C.Footer} {
		grid-row: 999;
		grid-column: 1;
		margin-block-start: calc(var(--baseline) * 2rem);

		color: var(--color-fg-sub);
	}

  @media (min-width: 700px) {
    .${C.Layout} {
      grid-template-columns: 200px minmax(0, 1fr);
    }

    .${C.Header}, .${C.Footer} {
      grid-column: 1 / -1;
    }
  }

  @media (min-width: 1000px) {
    .${C.Layout} {
      grid-template-columns: 1fr min(700px, 100%) 1fr;
    }

    .${C.Main}, .${C.Header}, .${C.Footer} {
      grid-column: 2;
    }

		.${C.Aside} {
			grid-column: 3;
		}

		.${C.NavInner}, .${C.AsideInner} {
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
		<div class={C.Layout}>
			<div class={C.HeaderBg} />
			{assets.siteLogo && (
				<header class={C.Header}>
					<a
						class={C.LogoLink}
						href={resolvePath([...defaultDocument.path, ""]).join("/")}
						title={defaultDocument.metadata.title}
						lang={defaultDocument.metadata.language}
					>
						<img
							class={C.Logo}
							src={resolvePath(assets.siteLogo).join("/")}
							width={32}
							height={32}
						/>
					</a>
				</header>
			)}
			<nav class={C.Nav}>
				<div class={C.NavInner}>{nav}</div>
			</nav>
			<main class={C.Main}>{main}</main>
			{aside && (
				<aside class={C.Aside}>
					<div class={C.AsideInner}>{aside}</div>
				</aside>
			)}
			<div class={C.FooterBg} />
			<footer class={C.Footer}>{footer}</footer>
		</div>
	);
}
