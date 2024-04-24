// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import type {
	Document,
	DocumentDirectory,
	DocumentTree,
} from "../../../../types.ts";

import { css } from "../../css.ts";
import { usePathResolver } from "../../contexts/path_resolver.tsx";
import { ChevronDown } from "../lucide_icons.tsx";

const enum C {
	Root = "o-dt--root",
	List = "o-dt--list",
	DirectoryHeader = "o-dt--dirh",
	Directory = "o-dt--dir",
	Chevron = "o-dt--ch",
	Link = "o-dt--ln",
}

export const styles = css`
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
`;

export interface ViewProps {
	tree: DocumentTree;

	currentPath: readonly string[];
}

export function View({ tree, currentPath }: ViewProps) {
	return (
		<ul className={C.Root} lang={tree.defaultLanguage}>
			{tree.nodes.map((entry) => (
				<Node
					value={entry}
					currentPath={currentPath}
				/>
			))}
		</ul>
	);
}

interface NodeProps {
	value: Document | DocumentDirectory;

	currentPath: readonly string[];
}

function Node({ value, currentPath }: NodeProps) {
	const pathResolver = usePathResolver();

	if ("file" in value) {
		const path = pathResolver.resolve([
			...value.path.map((segment) => encodeURIComponent(segment)),
			// For trailing slash
			"",
		]);

		return (
			<li lang={value.metadata.language ?? undefined}>
				<a className={C.Link} href={path}>{value.metadata.title}</a>
			</li>
		);
	}

	const defaultOpened = currentPath[0] === value.directory.name;

	return (
		<li lang={value.metadata.language ?? undefined}>
			<details className={C.Directory} open={defaultOpened ? "" : undefined}>
				<summary className={C.DirectoryHeader}>
					<ChevronDown className={C.Chevron} />
					<span>{value.metadata.title}</span>
				</summary>

				<ul className={C.List}>
					{value.entries.map((entry) => (
						<Node value={entry} currentPath={currentPath.slice(1)} />
					))}
				</ul>
			</details>
		</li>
	);
}
