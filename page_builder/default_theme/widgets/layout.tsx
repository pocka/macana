// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h, type Result } from "../../../deps/esm.sh/hastscript/mod.ts";

import type { BuildContext } from "../context.ts";
import { buildClasses, css, join } from "../css.ts";

import * as lucide from "../icons/lucide.tsx";

const c = buildClasses("w-l", [
	"layout",
	"appbar",
	"menu",
	"doctree",
	"siteInfo",
	"homeLink",
	"logoImage",
	"hiddenInput",
	"iconButton",
	"closeMenu",
	"main",
	"leftPadding",
	"paddingAppbarBorder",
	"fullscreenLayout",
]);

export const layoutScript = `
window.addEventListener("pageshow", (ev) => {
	const check = document.getElementById("__macana_menu_open");
	if (!check) {
		return;
	}

	if (ev.persisted) {
		const isMenuLayout = getComputedStyle(check).getPropertyValue("--_layout-menu");
		if (isMenuLayout) {
			document.documentElement.focus();
			check.checked = false;
		}
	}
});
`.trim();

export const layoutStyles = join(
	lucide.lucideIconStyles,
	css`
		html {
			scroll-padding-top: calc(8px + 2.5rem);
		}

		.${c.layout} {
			--_layout-menu: 1;
		}

		.${c.fullscreenLayout} {
			display: flex;
			flex-direction: column;
			height: 100vh;
			height: 100dvh;

			overflow: auto;
		}

		.${c.appbar},
		.${c.menu} {
			padding: 4px 8px;
		}

		.${c.appbar} {
			position: sticky;
			top: 0;
			display: flex;
			justify-content: space-between;
			align-items: center;
			border-block-end: 1px solid var(--color-border);

			background-color: var(--color-bg-accent);
			z-index: 100;
		}

		.${c.menu} {
			position: fixed;
			inset: 0;
			display: flex;
			flex-direction: column;
			justify-content: start;
			align-items: end;
			gap: 1rem;

			background-color: var(--color-bg-accent);
			z-index: 150;
			overflow-y: scroll;
			overflow-x: hidden;
			overscroll-behavior-y: contain;

			transform: translateX(100%);
			transition: transform 0.15s ease-out;
		}

		.${c.siteInfo} {
			display: flex;
			justify-content: start;
			align-items: center;
			gap: 0.5em;
			font-size: 0.9rem;
			line-height: 1.5;
		}

		.${c.homeLink} {
			display: flex;
			align-items: center;
			gap: 0.4em;
			font-size: 0.9rem;
			line-height: 1.25;
			font-weight: bold;

			color: var(--color-fg);
			text-decoration: none;
		}
		.${c.homeLink}:hover {
			text-decoration: underline;
		}

		.${c.logoImage} {
			height: 1.5rem;
			width: auto;
		}

		.${c.hiddenInput} {
			display: none;
		}

		#__macana_menu_open:checked ~ .${c.menu},
		.${c.menu}:focus-within {
			transform: translateX(0);
		}

		.${c.iconButton} {
			display: inline-flex;
			padding: 8px;
			font-size: 1.1rem;

			border-radius: 3px;
			cursor: pointer;
		}
		.${c.iconButton}:hover {
			background-color: var(--color-subtle-overlay);
		}

		.${c.closeMenu} {
			position: sticky;
			top: 4px;

			background-color: inherit;
		}

		.${c.main} {
			position: relative;
			flex: 1;
		}

		.${c.leftPadding} {
			display: none;
		}

		@media (pointer: fine) {
			.${c.iconButton} {
				padding: 6px;
			}
		}

		.${c.doctree} {
			align-self: stretch;
			flex-grow: 1;
		}

		@media (min-width: 65rem) {
			html {
				scroll-padding-top: calc(var(--baseline) * 1rem);
			}

			.${c.layout} {
				--_layout-menu: ;
				--_appbar-height: calc(var(--baseline) * 2rem);

				display: grid;
				grid-template-columns: 20rem minmax(0, 1fr);
				grid-template-rows: 100vh minmax(0, 1fr);
				grid-template-rows: 100dvh minmax(0, 1fr);
				grid-template-areas:
					"appbar main"
					"_ main";
			}

			.${c.appbar} {
				grid-area: appbar;
				padding-block: 0;
				height: var(--_appbar-height);
				align-self: start;
				border-inline-end: 1px solid var(--color-border);

				z-index: 200;
			}

			.${c.menu} {
				grid-area: appbar;
				position: sticky;
				top: var(--_appbar-height);
				height: calc(100% - var(--_appbar-height));
				padding-block-start: calc(var(--baseline) * 0.5rem);
				border-inline-end: 1px solid var(--color-border);

				transform: none;
			}

			.${c.iconButton} {
				display: none;
			}

			.${c.main} {
				grid-area: main;
			}
		}

		@media (min-width: 100rem) {
			.${c.layout} {
				grid-template-columns: minmax(0, 1fr) 25rem minmax(0, 6fr);
				grid-template-areas:
					"padding appbar main"
					"padding _ main";
			}

			.${c.leftPadding} {
				display: block;
				grid-area: padding;

				background-color: var(--color-bg-accent);
			}

			.${c.paddingAppbarBorder} {
				height: var(--_appbar-height);
				border-block-end: 1px solid var(--color-border);
				position: sticky;
				top: 0;
			}
		}
	`,
);

export interface LayoutProps {
	fullscreen?: boolean;

	/**
	 * Site navigation content.
	 */
	nav: Result;

	/**
	 * Content shown inside `<main>`.
	 */
	main: Result;

	footer: Result;

	context: BuildContext;
}

export function layout({
	fullscreen = false,
	nav,
	main,
	footer,
	context,
}: LayoutProps) {
	const {
		assets,
		resolvePath,
		documentTree: { defaultDocument },
		websiteTitle,
	} = context;

	return (
		<div
			class={[c.layout, fullscreen && c.fullscreenLayout].filter((
				s,
			): s is string => !!s)}
		>
			<div class={c.leftPadding}>
				<div class={c.paddingAppbarBorder} />
			</div>
			<input
				class={c.hiddenInput}
				type="checkbox"
				id="__macana_menu_open"
				aria-label="Menu opened"
			/>
			<header class={c.appbar}>
				<a
					class={c.homeLink}
					href={resolvePath([...defaultDocument.path, ""]).join("/")}
					title={defaultDocument.metadata.title}
					lang={defaultDocument.metadata.language}
				>
					{assets.siteLogo && (
						<img
							class={c.logoImage}
							src={resolvePath(assets.siteLogo).join("/")}
							width={32}
							height={32}
						/>
					)}
					<span>{websiteTitle}</span>
				</a>
				<label class={c.iconButton} for="__macana_menu_open" aria-hidden="true">
					{lucide.menu({})}
				</label>
			</header>
			<div class={c.menu}>
				<label
					className={[c.iconButton, c.closeMenu]}
					for="__macana_menu_open"
					aria-hidden="true"
				>
					{lucide.x({})}
				</label>
				<nav class={c.doctree}>{nav}</nav>
				<footer>{footer}</footer>
			</div>
			<main class={c.main}>{main}</main>
		</div>
	);
}
