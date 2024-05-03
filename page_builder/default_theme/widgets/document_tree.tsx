// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/esm.sh/hastscript/mod.ts";

import type { Document, DocumentDirectory } from "../../../types.ts";

import { buildClasses, css, join } from "../css.ts";
import type { BuildContext } from "../context.ts";
import * as icons from "../icons/lucide.tsx";

const c = buildClasses("w-dt", [
	"root",
	"list",
	"directoryHeader",
	"directory",
	"chevron",
	"link",
	"document",
]);

export const documentTreeStyles = join(
	icons.lucideIconStyles,
	css`
	.${c.root} {
		padding: calc(var(--baseline) * 0.25rem) 0.75em;
		font-size: 0.85rem;
	}

	.${c.root}, .${c.list} {
		margin: 0;
		list-style: none;
	}

	.${c.list} {
		padding: 0;
		padding-inline-start: calc(0.5em + 4px);
		margin-inline-start: calc(0.5em - 1px);
		border-inline-start: 2px solid var(--color-subtle-overlay);
		line-height: 2;
	}

	.${c.directoryHeader} {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 4px;

		cursor: pointer;
	}
	.${c.directoryHeader}::marker,
	.${c.directoryHeader}::-webkit-details-marker {
		display: none;
	}

	.${c.link} {
		color: var(--color-fg-sub);
		text-decoration: none;
	}
	.${c.link}:hover {
		text-decoration: underline;
	}
	.${c.link}[aria-current] {
		font-weight: bold;
	}

	.${c.directory} {
		display: flex;
	}

	.${c.document} {
		margin-inline-start: 1.25em;
	}

	.${c.chevron} {
		color: var(--color-fg-light);

		transition: transform 0.1s ease;
	}
	.${c.directory}:not([open]) > .${c.directoryHeader} > .${c.chevron} {
		transform: rotate(-90deg);
	}
`,
);

export interface DocumentTreeProps {
	context: Readonly<BuildContext>;
}

export function documentTree({ context }: DocumentTreeProps) {
	return (
		<ul className={c.root} lang={context.documentTree.defaultLanguage}>
			{context.documentTree.nodes.map((entry) => (
				node({
					value: entry,
					currentPath: context.document.path,
					context,
				})
			))}
		</ul>
	);
}

interface NodeProps {
	value: Document | DocumentDirectory;

	currentPath: readonly string[];

	context: Readonly<BuildContext>;
}

function node({ currentPath, value, context }: NodeProps) {
	if ("file" in value) {
		const path = context.resolvePath([
			...value.path.map((segment) => encodeURIComponent(segment)),
			// For trailing slash
			"",
		]);

		const isCurrent = value.path.length === context.document.path.length &&
			value.path.every((x, i) => context.document.path[i] === x);

		return (
			<li lang={value.metadata.language ?? undefined} class={c.document}>
				<a
					className={c.link}
					href={path.join("/")}
					aria-current={isCurrent ? "page" : undefined}
				>
					{value.metadata.title}
				</a>
			</li>
		);
	}

	const defaultOpened = currentPath[0] === value.metadata.name;

	return (
		<li lang={value.metadata.language ?? undefined}>
			<details className={c.directory} open={defaultOpened ? "" : undefined}>
				<summary className={c.directoryHeader}>
					{icons.chevronDown({ className: c.chevron })}
					<span>{value.metadata.title}</span>
				</summary>

				<ul className={c.list}>
					{value.entries.map((entry) => (
						node({
							value: entry,
							currentPath: currentPath.slice(1),
							context,
						})
					))}
				</ul>
			</details>
		</li>
	);
}
