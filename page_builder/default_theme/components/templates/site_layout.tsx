// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { type Document } from "../../../../types.ts";

import { usePathResolver } from "../../contexts/path_resolver.tsx";

import { css } from "../../css.ts";

const enum C {
	Layout = "t-sl--root",
	HeaderBg = "t-sl--headbg",
	Header = "t-sl--head",
	Logo = "t-sl--lg",
	LogoLink = "t-sl--ll",
	Nav = "t-sl--nav",
	NavInner = "t-sl--nav-i",
	FooterBg = "t-sl--fbg",
	Footer = "t-sl--foot",
	Main = "t-sl--main",
	Aside = "t-sl--aside",
	AsideInner = "t-sl--aside-i",
}

export const styles = css`
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

export interface ViewProps {
	children: JSX.ElementChildrenAttribute["children"];

	nav: JSX.ElementChildrenAttribute["children"];

	aside?: JSX.ElementChildrenAttribute["children"];

	footer: JSX.ElementChildrenAttribute["children"];

	logoImage?: readonly string[];

	logoSize?: number;

	defaultDocument: Document;
}

export function View(
	{ children, nav, aside, footer, logoImage, logoSize = 32, defaultDocument }:
		ViewProps,
) {
	const path = usePathResolver();

	return (
		<div className={C.Layout}>
			<div className={C.HeaderBg} />
			{logoImage && (
				<header className={C.Header}>
					<a
						className={C.LogoLink}
						href={path.resolve([...defaultDocument.path, ""])}
						title={defaultDocument.metadata.title}
						lang={defaultDocument.metadata.language}
					>
						<img
							className={C.Logo}
							src={path.resolve(logoImage)}
							width={logoSize}
							height={logoSize}
						/>
					</a>
				</header>
			)}
			<nav className={C.Nav}>
				<div className={C.NavInner}>{nav}</div>
			</nav>
			<main className={C.Main}>{children}</main>
			{aside && (
				<aside className={C.Aside}>
					<div className={C.AsideInner}>{aside}</div>
				</aside>
			)}
			<div className={C.FooterBg} />
			<footer className={C.Footer}>{footer}</footer>
		</div>
	);
}
