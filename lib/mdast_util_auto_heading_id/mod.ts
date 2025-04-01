// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/npm/mdast/types.ts";
import type { Extension } from "../../deps/npm/mdast-util-from-markdown/mod.ts";
import { SKIP, visit } from "../../deps/npm/unist-util-visit/mod.ts";
import { toString } from "../../deps/npm/mdast-util-to-string/mod.ts";
import { fastUslug } from "../../deps/npm/@shelf/fast-uslug/mod.ts";

function hasHProperties(
	data: Mdast.Data | undefined,
): data is Mdast.Data & { hProperties: Record<string, unknown> } {
	return !!(data && "hProperties" in data &&
		typeof data.hProperties === "object" && data.hProperties);
}

/**
 * This function mutates the given node tree.
 */
export function autoHeadingId(nodes: Mdast.Nodes): void {
	const counts = new Map<string, number>();

	visit(nodes, (node) => node.type === "heading", (node) => {
		if (node.type !== "heading") {
			return SKIP;
		}

		if (hasHProperties(node.data) && node.data.hProperties.id) {
			return SKIP;
		}

		const id = fastUslug(toString(node), {
			lower: false,
		});

		const count = counts.get(id) ?? 0;
		counts.set(id, count + 1);

		const finalId = count > 0 ? id + "__" + count : id;

		node.data = {
			...node.data,
			hProperties: {
				...(node.data && "hProperties" in node.data &&
						typeof node.data.hProperties === "object"
					? node.data.hProperties
					: {}),
				id: finalId,
			},
		};
	});
}

export function autoHeadingIdFromMarkdown(): Extension {
	return {
		transforms: [(nodes) => {
			autoHeadingId(nodes);
		}],
	};
}
