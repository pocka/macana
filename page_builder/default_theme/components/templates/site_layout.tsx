// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { css } from "../../css.ts";

const enum C {
	Layout = "t-sl--root",
	NavBg = "t-sl--navbg",
	Header = "t-sl--head",
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

	.${C.NavBg} {
		grid-row: 1;
		grid-column: 1 / -1;
		margin-block-end: calc(var(--baseline) * 2rem);

		background-color: var(--color-bg-accent);
	}

	.${C.Header} {
		grid-row: 1;
		grid-column: 1;
		margin-block-end: calc(var(--baseline) * 2rem);
	}

	.${C.Nav} {
		grid-column: 1;
	}

	.${C.NavInner}, .${C.AsideInner} {
		position: sticky;
		top: calc(var(--baseline) * 1rem);

		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.${C.NavInner}:hover {
		opacity: 1;
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
}

export function View({ children, nav, aside, footer }: ViewProps) {
	return (
		<div className={C.Layout}>
			<div className={C.NavBg} />
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
