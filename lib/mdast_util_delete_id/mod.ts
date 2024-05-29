// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { visit } from "../../deps/esm.sh/unist-util-visit/mod.ts";

/**
 * This mutates given tree.
 */
export function deleteId<T extends Mdast.Node>(tree: T): void {
	visit(tree, (node) => {
		if (!node.data) {
			return;
		}

		if (
			!("hProperties" in node.data) ||
			typeof node.data.hProperties !== "object" || !node.data.hProperties
		) {
			return;
		}

		node.data = {
			hProperties: {
				...node.data.hProperties,
				id: undefined,
			},
		};
	});
}
