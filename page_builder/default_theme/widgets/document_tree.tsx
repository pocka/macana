// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/esm.sh/hastscript/mod.ts";

import type { Document, DocumentDirectory } from "../../../types.ts";

import { css, join } from "../css.ts";
import type { BuildContext } from "../context.ts";
import * as icons from "../icons/lucide.tsx";

const enum C {
	Root = "w-dt--root",
	List = "w-dt--list",
	DirectoryHeader = "w-dt--dirh",
	Directory = "w-dt--dir",
	Chevron = "w-dt--ch",
	Link = "w-dt--ln",
}

export const documentTreeStyles = join(
	icons.lucideIconStyles,
	css`
	.${C.Root} {
		padding: calc(var(--baseline) * 0.25rem) 0.75em;
		font-size: 0.85rem;
	}

	.${C.Root}, .${C.List} {
		margin: 0;
		list-style: none;
	}

	.${C.List} {
		padding: 0;
		padding-inline-start: calc(1em + 4px);
		border-inline-start: 2px solid var(--color-subtle-overlay);
	}

	.${C.DirectoryHeader} {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 4px;

		cursor: pointer;
	}
	.${C.DirectoryHeader}::marker,
	.${C.DirectoryHeader}::-webkit-details-marker {
		display: none;
	}

	.${C.Link} {
		color: var(--color-fg-sub);
		text-decoration: none;
	}
	.${C.Link}:hover {
		text-decoration: underline;
	}

	.${C.Directory} {
		display: flex;
	}

	.${C.Chevron} {
		color: var(--color-fg-light);

		transition: transform 0.1s ease;
	}
	.${C.Directory}:not([open]) > .${C.DirectoryHeader} > .${C.Chevron} {
		transform: rotate(-90deg);
	}
`,
);

export interface DocumentTreeProps {
	context: Readonly<BuildContext>;
}

export function documentTree({ context }: DocumentTreeProps) {
	return (
		<ul className={C.Root} lang={context.documentTree.defaultLanguage}>
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

		return (
			<li lang={value.metadata.language ?? undefined}>
				<a className={C.Link} href={path.join("/")}>{value.metadata.title}</a>
			</li>
		);
	}

	const defaultOpened = currentPath[0] === value.directory.name;

	return (
		<li lang={value.metadata.language ?? undefined}>
			<details className={C.Directory} open={defaultOpened ? "" : undefined}>
				<summary className={C.DirectoryHeader}>
					{icons.chevronDown({ className: C.Chevron })}
					<span>{value.metadata.title}</span>
				</summary>

				<ul className={C.List}>
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
