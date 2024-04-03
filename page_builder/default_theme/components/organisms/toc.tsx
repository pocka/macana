// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { type TocItem } from "../../hast/hast_util_toc_mut.ts";

import { css } from "../../css.ts";

const enum C {
	Root = "o-toc--root",
}

export const styles = css`
	.${C.Root} {
		font-size: 0.8em;
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
		<ul>
			{toc.map((item) => (
				<li>
					<a href={`#${item.id}`}>{item.text}</a>
					{item.children.length > 0 && <Items toc={item.children} />}
				</li>
			))}
		</ul>
	);
}
