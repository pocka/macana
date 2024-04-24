// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { type CalloutType } from "../../../../content_parser/obsidian_markdown.ts";

import { css } from "../../css.ts";

const enum C {
	Root = "m-co--root",
}

export const styles = css`
	border-radius: 4px;
`;

export interface ViewProps {
	title: JSX.ElementChildrenAttribute["children"];

	type?: CalloutType;

	foldable?: boolean;
	defaultExpanded?: boolean;

	children: JSX.ElementChildrenAttribute["children"];
}

let counter = 0;

export function View(
	{ title, type = "note", foldable = false, defaultExpanded = false, children }:
		ViewProps,
) {
	const Body = foldable ? "details" : "div";
	const Title = foldable ? "summary" : "p";
	const bodyProps = foldable
		? {
			open: defaultExpanded ? "" : undefined,
		}
		: {};

	const titleId = "__macana_callout__" + (counter++).toString(16);

	return (
		<aside {...bodyProps} className={C.Root} aria-labelledby={titleId}>
			<Body data-ofm-callout-type={type}>
				<Title>{title}</Title>
				<div>{children}</div>
			</Body>
		</aside>
	);
}
