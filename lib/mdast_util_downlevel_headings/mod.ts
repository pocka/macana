// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/npm/mdast/types.ts";
import type { Extension } from "../../deps/npm/mdast-util-from-markdown/mod.ts";
import { SKIP, visit } from "../../deps/npm/unist-util-visit/mod.ts";

export class HeadingLevelExceedsLimitError extends Error {
	constructor(level: number, magnitude: number) {
		super(
			`Attempt to down-level h${level} by ${magnitude},` +
				` but resulting level (${level + magnitude}) exceeds limit (6)`,
		);
	}
}

export interface DownlevelHeadingsOptions {
	magnitude?: 1 | 2 | 3 | 4 | 5;
}

/**
 * Down-level headings by given amount (`magnitude`).
 * e.g. `# Foo` -> `## Foo`
 *
 * This functions throws `HeadingLevelExceedsLimitError` when the final
 * heading level exceeds 6 (`<h6>`).
 */
export function downlevelHeadings(
	nodes: Mdast.Nodes,
	{ magnitude = 1 }: DownlevelHeadingsOptions = {},
): void {
	visit(nodes, (node) => node.type === "heading", (node) => {
		if (node.type !== "heading") {
			return SKIP;
		}

		if (node.depth + magnitude > 6) {
			throw new HeadingLevelExceedsLimitError(node.depth, magnitude);
		}

		node.depth = (node.depth + magnitude) as 1 | 2 | 3 | 4 | 5 | 6;
	});
}

export function downlevelHeadingsFromMarkdown(
	options: DownlevelHeadingsOptions = {},
): Extension {
	return {
		transforms: [(nodes) => {
			downlevelHeadings(nodes, options);
		}],
	};
}
