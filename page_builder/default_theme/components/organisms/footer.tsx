// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { css } from "../../css.ts";

const enum C {
	Root = "o-fo--root",
	Copyright = "o-fo--cpy",
	Links = "o-fo--links",
}

export const styles = css`
	.${C.Root} {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2em;
	}

	.${C.Copyright} {
		font-size: 0.8em;
	}

	.${C.Links} {
		font-size: 0.9em;
		display: flex;
		gap: 0.25em 0.5em;
		justify-content: start;
		align-items: start;
	}
`;

export interface ViewProps {
	copyright: JSX.ElementChildrenAttribute["children"];

	children?: JSX.ElementChildrenAttribute["children"];
}

export function View({ copyright, children }: ViewProps) {
	return (
		<div className={C.Root}>
			<small className={C.Copyright}>{copyright}</small>
			{children && (
				<div className={C.Links}>
					{children}
				</div>
			)}
		</div>
	);
}
