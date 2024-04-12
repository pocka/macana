// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";

import { visit } from "../../deps/esm.sh/unist-util-visit/mod.ts";

import type { AssetToken } from "../../types.ts";

function extractToken(node: Mdast.Node): AssetToken {
	if (
		!node.data || !("macanaAssetToken" in node.data) ||
		typeof node.data.macanaAssetToken !== "string" ||
		!node.data.macanaAssetToken.startsWith("mxa_")
	) {
		throw new Error(`Asset Token not found on the node: ${node.type}`);
	}

	return node.data.macanaAssetToken as AssetToken;
}

function replace(node: Mdast.Nodes, replacedPath: string): void {
	switch (node.type) {
		case "image": {
			node.url = replacedPath;
			return;
		}
		case "definition": {
			node.url = replacedPath;
			return;
		}
	}
}

/**
 * Modifies the given Mdast tree by searching nodes having `macanaAssetToken`
 * property then replacing node properties.
 * This function modifies Mdast tree in place.
 *
 * @param tree - Mdast tree to modify.
 * @param replacer - A function that takes Asset Token and returns path *string* for the asset.
 */
export async function macanaReplaceAssetTokens(
	tree: Mdast.Nodes,
	replacer: (token: AssetToken) => string | Promise<string>,
): Promise<void> {
	const promises: Promise<unknown>[] = [];

	visit(
		tree,
		(node) =>
			node.data && "macanaAssetToken" in node.data &&
			typeof node.data.macanaAssetToken === "string",
		(node) => {
			const token = extractToken(node);

			const replaced = replacer(token);

			if (replaced instanceof Promise) {
				promises.push(replaced.then((str) => {
					replace(node, str);
				}));
				return;
			}

			replace(node, replaced);
		},
	);

	await Promise.all(promises);
}
