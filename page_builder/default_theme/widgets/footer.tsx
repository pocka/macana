// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { Child, h } from "../../../deps/esm.sh/hastscript/mod.ts";

import { buildClasses, css } from "../css.ts";

const c = buildClasses("w-fo", [
	"root",
	"copyright",
	"links",
]);

export const footerStyles = css`
	.${c.root} {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2em;
	}

	.${c.copyright} {
		font-size: 0.8em;
	}

	.${c.links} {
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
		<div class={c.root}>
			<small class={c.copyright}>{copyright}</small>
			{children && (
				<div class={c.links}>
					{children}
				</div>
			)}
		</div>
	);
}
