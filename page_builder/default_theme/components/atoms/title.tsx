// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { css } from "../../css.ts";

const enum C {
	Title = "a--title",
}

export const styles = css`
	.${C.Title} {
		font-weight: 700;
		font-size: 2rem;
		margin: 0;
		line-height: calc(var(--baseline) * 2rem);

		color: var(--color-fg-sub);
	}
`;

export interface ViewProps {
	className?: string;

	children: JSX.ElementChildrenAttribute["children"];
}

export function View({ className, children }: ViewProps) {
	return (
		<h1 className={[className, C.Title].filter((s) => !!s).join(" ")}>
			{children}
		</h1>
	);
}
