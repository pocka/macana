// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { css } from "../../css.ts";

import * as LucideIcons from "../lucide_icons.tsx";

const enum C {
	TaskItem = "fh-tl--i",
	Checkbox = "fh-tl--c",
	Check = "fh-tl--h",
	Text = "fh-tl--t",
}

export const styles = css`
	.${C.TaskItem} {
		display: flex;
		align-items: start;
		list-style: none;
	}

	.${C.Checkbox} {
		display: flex;
		align-items: stretch;
		justify-content: stretch;
		width: calc(1em - 2px);
		height: calc(1em - 2px);
		aspect-ratio: 1 / 1;
		border: 1px solid currentColor;
		margin: 0;
		margin-block-start: calc((var(--baseline) * 1rem - 1em) * 0.5 + 1px);
		margin-inline-start: calc(-1em - 2px);
		margin-inline-end: 4px;

		border-radius: 2px;
	}

	.${C.Check} {
		min-width: 0px;
		min-height: 0px;
		height: 100%;
	}

	.${C.Text} {
		line-height: calc(var(--baseline) * 1rem);
	}
`;

export interface MacanaGfmTaskListProps {
	ordered?: "" | false;

	children: unknown;
}

export function MacanaGfmTaskList(
	{ ordered, children }: MacanaGfmTaskListProps,
) {
	const Tag = ordered ? "ol" : "ul";

	return (
		<Tag>
			{children}
		</Tag>
	);
}

let checkCounter = 0;

export interface MacanaGfmTaskListItemProps {
	is_task: "" | false;
	checked?: "" | false;

	children: unknown;
}

export function MacanaGfmTaskListItem(
	{ children, checked, is_task }: MacanaGfmTaskListItemProps,
) {
	if (typeof is_task !== "string") {
		return <li>{children}</li>;
	}

	const isChecked = typeof checked === "string";
	const labelId = `__macana_tcheck_lbl__${checkCounter++}`;

	return (
		<li className={C.TaskItem}>
			<span
				className={C.Checkbox}
				role="checkbox"
				aria-disabled="true"
				tabindex="0"
				aria-checked={isChecked.toString()}
				aria-labelledby={labelId}
			>
				{isChecked && (
					<LucideIcons.Check className={C.Check} aria-hidden="true" />
				)}
			</span>
			<span id={labelId} className={C.Text}>{children}</span>
		</li>
	);
}
