// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/esm.sh/hastscript/mod.ts";

import type { TocItem } from "../hast/hast_util_toc_mut.ts";
import { css } from "../css.ts";

const enum C {
	Root = "w-toc--root",
	List = "w-toc--l",
	Item = "w-toc--i",
	Link = "w-toc--k",
}

export const tocStyles = css`
	.${C.Root} {
		font-size: 0.8rem;
	}

	.${C.List} {
		display: flex;
		flex-direction: column;
		padding-left: 0.75em;
		border-left: 2px solid var(--color-subtle-overlay);
	}

	.${C.Item} {
		display: flex;
		flex-direction: column;
	}

	.${C.Link} {
		text-decoration: none;

		color: var(--color-fg-sub);
	}
	.${C.Link}:hover {
		text-decoration: underline;
	}
`;

export interface TocProps {
	toc: readonly TocItem[];
}

export function toc({ toc }: TocProps) {
	return (
		<div class={C.Root}>
			{items({ toc })}
		</div>
	);
}

export function items({ toc }: TocProps) {
	return (
		<ul className={C.List}>
			{toc.map((item) => (
				<li class={C.Item}>
					<a class={C.Link} href={`#${item.id}`}>{item.text}</a>
					{item.children.length > 0 ? items({ toc: item.children }) : null}
				</li>
			))}
		</ul>
	);
}
