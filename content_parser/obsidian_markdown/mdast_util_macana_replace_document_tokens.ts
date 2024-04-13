// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";

import { visit } from "../../deps/esm.sh/unist-util-visit/mod.ts";

import type { DocumentToken } from "../../types.ts";

function hasDocumentToken(
	node: Mdast.Node,
): node is typeof node & { data: { macanaDocumentToken: DocumentToken } } {
	return !!(node.data && ("macanaDocumentToken" in node.data) &&
		typeof node.data.macanaDocumentToken === "string" &&
		node.data.macanaDocumentToken.startsWith("mxt_"));
}

export interface ExchangeResult {
	/**
	 * Path string appears on the final markup.
	 */
	path: string;
}

function replace(node: Mdast.Nodes, { path }: ExchangeResult): void {
	switch (node.type) {
		case "link": {
			node.url = path;
			return;
		}
		case "definition": {
			node.url = path;
			return;
		}
	}
}

/**
 * Modifies the given Mdast tree by searching nodes having `macanaDocumentToken`
 * property then replacing node properties.
 * This function modifies Mdast tree in place.
 *
 * @param tree - Mdast tree to modify.
 * @param exchange - A function that takes Document Token and returns properties required for constructing markup.
 */
export function macanaReplaceDocumentToken(
	tree: Mdast.Nodes,
	exchange: (token: DocumentToken) => ExchangeResult | Promise<ExchangeResult>,
): Promise<void> | void {
	const promises: Promise<unknown>[] = [];

	visit(
		tree,
		(node) => hasDocumentToken(node),
		(node) => {
			if (!hasDocumentToken(node)) {
				return;
			}

			const exchanged = exchange(node.data.macanaDocumentToken);

			if (exchanged instanceof Promise) {
				promises.push(exchanged.then((payload) => {
					replace(node, payload);
				}));
				return;
			}

			replace(node, exchanged);
		},
	);

	if (promises.length > 0) {
		return Promise.all(promises).then(() => {});
	}
}
