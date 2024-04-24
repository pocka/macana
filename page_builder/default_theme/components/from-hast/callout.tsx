// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import {
	createContext,
	h,
	useContext,
} from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { type CalloutType } from "../../../../content_parser/obsidian_markdown.ts";

import { css } from "../../css.ts";

import * as LucideIcons from "../lucide_icons.tsx";

const enum C {
	Root = "fh-co--root",
	Title = "fh-co--title",
	TitleText = "fh-co--tt",
	Body = "fh-co--b",
	Icon = "fh-co--i",
	Bg = "fg-co--g",
	Chevron = "fg-co--c",
}

export const styles = css`
	.${C.Root} {
		--_macana-callout-overlay: hsl(0deg 0% 0% / 0.03);
		--_macana-callout-color: var(--callout-color-info, var(--obsidian-color-fallback));

		position: relative;
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
		padding: 0;
		line-height: calc(var(--baseline) * 1rem);
		max-width: 100%;
		font-size: 1rem;
		border: 1px solid var(--_macana-callout-color);

		border-radius: 4px;
	}
	.${C.Root}[data-type="todo"] {
		--_macana-callout-color: var(--callout-color-todo);
	}
	.${C.Root}[data-type="tip"] {
		--_macana-callout-color: var(--callout-color-tip);
	}
	.${C.Root}[data-type="success"] {
		--_macana-callout-color: var(--callout-color-success);
	}
	.${C.Root}[data-type="question"] {
		--_macana-callout-color: var(--callout-color-question);
	}
	.${C.Root}[data-type="warning"] {
		--_macana-callout-color: var(--callout-color-warning);
	}
	.${C.Root}[data-type="failure"] {
		--_macana-callout-color: var(--callout-color-failure);
	}
	.${C.Root}[data-type="danger"] {
		--_macana-callout-color: var(--callout-color-danger);
	}
	.${C.Root}[data-type="bug"] {
		--_macana-callout-color: var(--callout-color-bug);
	}
	.${C.Root}[data-type="example"] {
		--_macana-callout-color: var(--callout-color-example);
	}
	.${C.Root}[data-type="quote"] {
		--_macana-callout-color: var(--callout-color-quote);
	}

	.${C.Bg} {
		position: absolute;
		inset: 0;

		background-color: var(--_macana-callout-color);
		pointer-events: none;

		opacity: 0.02;
	}

	@media (prefers-color-scheme: dark) {
		.${C.Root} {
			--_macana-callout-overlay: hsl(0deg 0% 100% / 0.1);
		}

		.${C.Bg} {
			opacity: 0.05;
		}
	}

	.${C.Title} {
		font-size: 1.1rem;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 0.25em;
		padding: calc(var(--baseline) * 0.5rem) 8px;
		border-bottom: 1px solid var(--_macana-callout-overlay);

		margin-top: 0;
		font-weight: 700;
	}
	summary.${C.Title} {
		cursor: pointer;
	}
	summary.${C.Title}:hover {
		background-color: var(--_macana-callout-overlay);
	}
	details:not([open]) > summary.${C.Title} {
		border-bottom-color: transparent;
	}

	.${C.Icon} {
		color: var(--_macana-callout-color);
	}

	.${C.TitleText} {
		line-height: calc(var(--baseline) * 1rem);
	}

	.${C.Chevron} {
		transition: transform 0.15s ease-out;
	}
	details:not([open]) .${C.Chevron} {
		transform: rotate(-90deg);
	}

	.${C.Body} {
		font-size: 1rem;

		padding: calc(var(--baseline) * 0.5rem) 12px;
	}
	.${C.Body} > :first-child {
		margin-block-start: 0;
	}
`;

interface CalloutContextValue {
	foldable: boolean;
	defaultExpanded: boolean;
	type: CalloutType;
	titleId: string;
}

const CalloutContext = createContext(
	{
		foldable: false,
		defaultExpanded: false,
		type: "note",
		titleId: "",
	} satisfies CalloutContextValue,
);

export interface ViewProps {
	type?: CalloutType;

	foldable?: "" | false;
	defaultExpanded?: "" | false;

	children: JSX.ElementChildrenAttribute["children"];
}

let counter = 0;

export function MacanaOfmCallout(
	{ type = "note", foldable = false, defaultExpanded = false, children }:
		ViewProps,
) {
	const titleId = "__macana_callout__" + (counter++).toString(16);

	const isFoldable = typeof foldable === "string";
	const isDefaultExpanded = typeof defaultExpanded === "string";

	const contextValue: CalloutContextValue = {
		foldable: isFoldable,
		defaultExpanded: isDefaultExpanded,
		type,
		titleId,
	};

	if (!isFoldable) {
		return (
			<aside
				className={C.Root}
				aria-labelledby={titleId}
				data-type={type}
			>
				<div className={C.Bg} />
				<CalloutContext.Provider value={contextValue}>
					{children}
				</CalloutContext.Provider>
			</aside>
		);
	}

	return (
		<aside
			className={C.Root}
			aria-labelledby={titleId}
			data-type={type}
		>
			<div className={C.Bg} />
			<details open={isDefaultExpanded ? "" : undefined}>
				<CalloutContext.Provider value={contextValue}>
					{children}
				</CalloutContext.Provider>
			</details>
		</aside>
	);
}

interface IconProps {
	className?: string;

	type: CalloutType;
}

function Icon({ className, type }: IconProps) {
	switch (type) {
		case "abstract":
			return (
				<LucideIcons.ClipboardList
					className={className}
					role="img"
					aria-label="Clipboard icon"
				/>
			);
		case "info":
			return (
				<LucideIcons.Info
					className={className}
					role="img"
					aria-label="Info icon"
				/>
			);
		case "todo":
			return (
				<LucideIcons.CircleCheck
					className={className}
					role="img"
					aria-label="Check icon"
				/>
			);
		case "tip":
			return (
				<LucideIcons.Flame
					className={className}
					role="img"
					aria-label="Flame icon"
				/>
			);
		case "success":
			return (
				<LucideIcons.Check
					className={className}
					role="img"
					aria-label="Check icon"
				/>
			);
		case "question":
			return (
				<LucideIcons.CircleHelp
					className={className}
					role="img"
					aria-label="Question icon"
				/>
			);
		case "warning":
			return (
				<LucideIcons.TriangleAlert
					className={className}
					role="img"
					aria-label="Warning icon"
				/>
			);
		case "failure":
			return (
				<LucideIcons.X
					className={className}
					role="img"
					aria-label="Cross icon"
				/>
			);
		case "danger":
			return (
				<LucideIcons.Zap
					className={className}
					role="img"
					aria-label="Lightning icon"
				/>
			);
		case "bug":
			return (
				<LucideIcons.Bug
					className={className}
					role="img"
					aria-label="Bug icon"
				/>
			);
		case "example":
			return (
				<LucideIcons.List
					className={className}
					role="img"
					aria-label="List icon"
				/>
			);
		case "quote":
			return (
				<LucideIcons.Quote
					className={className}
					role="img"
					aria-label="Quote icon"
				/>
			);
		case "note":
		default:
			return (
				<LucideIcons.Pencil
					className={className}
					role="img"
					aria-label="Pencil icon"
				/>
			);
	}
}

export interface MacanaOfmCalloutTitleProps {
	children: JSX.ElementChildrenAttribute["children"];
}

export function MacanaOfmCalloutTitle(
	{ children }: MacanaOfmCalloutTitleProps,
) {
	const { titleId, type, foldable }: CalloutContextValue = useContext(
		CalloutContext,
	);

	if (foldable) {
		return (
			<summary className={C.Title} id={titleId}>
				<Icon className={C.Icon} type={type} />
				<span className={C.TitleText}>{children}</span>
				<LucideIcons.ChevronDown className={C.Chevron} aria-hidden="true" />
			</summary>
		);
	}

	return (
		<p className={C.Title} id={titleId}>
			<Icon className={C.Icon} type={type} />
			<span className={C.TitleText}>{children}</span>
		</p>
	);
}

export interface MacanaOfmCalloutBodyProps {
	children: JSX.ElementChildrenAttribute["children"];
}

export function MacanaOfmCalloutBody({ children }: MacanaOfmCalloutBodyProps) {
	return <div className={C.Body}>{children}</div>;
}
