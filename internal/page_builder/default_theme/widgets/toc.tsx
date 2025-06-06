// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/npm/hastscript/mod.ts";

import type { TocItem } from "../../../../lib/hast_util_toc/mod.ts";

import { buildClasses, css, cx } from "../css.ts";

const c = buildClasses("w-toc", ["root", "list", "item", "link"]);

export const tocStyles = css`
	.${c.root} {
		font-size: 0.8rem;
		line-height: 1.8;
	}

	.${c.list} {
		display: flex;
		flex-direction: column;
		padding-left: 0.75em;
		border-left: 2px solid var(--color-subtle-overlay);
	}

	.${c.item} {
		display: flex;
		flex-direction: column;
	}

	.${c.link} {
		text-decoration: none;

		color: var(--color-fg-sub);
	}
	.${c.link}[aria-current] {
		color: var(--color-fg);
		text-decoration: underline;
	}
	.${c.link}[aria-current="false"] {
		color: var(--color-fg-sub);
		text-decoration: none;

		opacity: 0.7;
	}
	.${c.link}:hover {
		text-decoration: underline;
	}
`;

export interface TocProps {
	className?: string;

	toc: readonly TocItem[];
}

export function toc({ className, toc }: TocProps) {
	return (
		<div class={cx(c.root, className)}>
			{items({ toc })}
		</div>
	);
}

export function items({ toc }: TocProps) {
	return (
		<ul className={c.list}>
			{toc.map((item) => (
				<li class={c.item}>
					<a class={c.link} href={`#${item.id}`}>{item.text}</a>
					{item.children.length > 0 ? items({ toc: item.children }) : null}
				</li>
			))}
		</ul>
	);
}
