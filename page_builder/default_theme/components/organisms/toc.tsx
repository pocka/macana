// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { type TocItem } from "../../hast/hast_util_toc_mut.ts";

import { css } from "../../css.ts";

const enum C {
	Root = "o-toc--root",
	List = "o-toc--l",
	Item = "o-toc--i",
	Link = "o-toc--k",
}

export const styles = css`
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

export interface ViewProps {
	// nano-jsx does not ship any useful typings
	toc: readonly TocItem<unknown>[];
}

export function View({ toc }: ViewProps) {
	return (
		<div className={C.Root}>
			<Items toc={toc} />
		</div>
	);
}

export function Items({ toc }: ViewProps) {
	return (
		<ul className={C.List}>
			{toc.map((item) => (
				<li className={C.Item}>
					<a className={C.Link} href={`#${item.id}`}>{item.text}</a>
					{item.children.length > 0 && <Items toc={item.children} />}
				</li>
			))}
		</ul>
	);
}
