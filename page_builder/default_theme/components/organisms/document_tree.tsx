// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import type {
	Document,
	DocumentDirectory,
} from "../../../../tree_builder/interface.ts";

import { css } from "../../css.ts";
import { usePathResolver } from "../../contexts/path_resolver.tsx";

const enum C {
	Root = "o-dt--root",
	List = "o-dt--list",
	Directory = "o-dt--dir",
}

export const styles = css`
	.${C.Root} {
		padding: calc(var(--baseline) * 0.25rem) 0.75em;
		font-size: 0.9em;
	}

	.${C.Root}, .${C.List} {
		list-style: none;
	}

	.${C.Directory} {
		cursor: pointer;
	}
`;

export interface ViewProps {
	tree: ReadonlyArray<Document | DocumentDirectory>;

	currentPath: readonly string[];
}

export function View({ tree, currentPath }: ViewProps) {
	return (
		<ul className={C.Root}>
			{tree.map((entry) => (
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
			...value.file.path.slice(0, -1),
			value.file.name.replace(/\.md$/, ""),
			"",
		]);

		return (
			<li>
				<a href={path}>{value.metadata.title}</a>
			</li>
		);
	}

	const defaultOpened = currentPath[0] === value.directory.name;

	return (
		<li>
			<details className={C.Directory} open={defaultOpened ? "" : undefined}>
				<summary>{value.metadata.title}</summary>

				<ul className={C.List}>
					{value.entries.map((entry) => (
						<Node value={entry} currentPath={currentPath.slice(1)} />
					))}
				</ul>
			</details>
		</li>
	);
}
