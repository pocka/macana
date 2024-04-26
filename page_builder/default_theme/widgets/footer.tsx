// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { Child, h } from "../../../deps/esm.sh/hastscript/mod.ts";

import { css } from "../css.ts";

const enum C {
	Root = "w-fo--root",
	Copyright = "w-fo--cpy",
	Links = "w-fo--links",
}

export const footerStyles = css`
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

export interface FooterProps {
	copyright: Child;

	children?: Child;
}

export function footer({ copyright, children }: FooterProps) {
	return (
		<div class={C.Root}>
			<small class={C.Copyright}>{copyright}</small>
			{children && (
				<div class={C.Links}>
					{children}
				</div>
			)}
		</div>
	);
}
