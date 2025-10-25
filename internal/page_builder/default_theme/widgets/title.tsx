// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { type Child, h } from "../../../../deps/npm/hastscript/mod.ts";

import { buildClasses, css } from "../css.ts";

const c = buildClasses("w-title", ["title"]);

export const titleStyles = css`
	.${c.title} {
		font-weight: 700;
		font-size: 1.8rem;
		margin: 0;
		margin-block-end: calc(var(--baseline) * 1rem);
		line-height: calc(var(--baseline) * 1rem);

		color: var(--color-fg-sub);
	}
`;

export interface TitleProps {
	className?: string;

	children: Child;
}

export function title({ className, children }: TitleProps) {
	return (
		<h1 class={[className, c.title].filter((s) => !!s).join(" ")}>
			{children}
		</h1>
	);
}
