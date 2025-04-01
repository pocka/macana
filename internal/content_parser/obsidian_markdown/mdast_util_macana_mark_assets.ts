// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../../deps/npm/mdast/types.ts";
import { SKIP, visit } from "../../../deps/npm/unist-util-visit/mod.ts";
import { definitions } from "../../../deps/npm/mdast-util-definitions/mod.ts";

import type { AssetToken } from "../../types.ts";

import type { OfmWikilinkEmbed } from "../../../lib/mdast_util_ofm_wikilink/mod.ts";
import type { ParseParameters } from "../interface.ts";

const SEPARATOR = "/";
const URL_REGEXP_PATTERN = /^[a-z0-9]+:\/\//i;

function setToken(node: Mdast.Node) {
	return (token: AssetToken) => {
		node.data = {
			...node.data,
			// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
			//                   which Deno does not support. APIs also don't accept type parameters.
			macanaAssetToken: token,
		};
	};
}

/**
 * Searches asset references mark those node by setting `macanaAssetToken` with Asset Token.
 * This function modifies the Mdast tree in place.
 */
export async function macanaMarkAssets(
	tree: Mdast.Nodes | OfmWikilinkEmbed,
	getAssetToken: ParseParameters["getAssetToken"],
): Promise<void> {
	const promises: Promise<unknown>[] = [];

	const defs = definitions(tree as Mdast.Nodes);

	visit(
		tree,
		(node) =>
			node.type === "image" || node.type === "imageReference" ||
			node.type === "ofmWikilinkEmbed",
		(node) => {
			switch (node.type) {
				case "ofmWikilinkEmbed": {
					// This node is document embed.
					if (node.data && "macanaDocumentToken" in node.data) {
						return SKIP;
					}

					const path = node.target.split(SEPARATOR);

					promises.push(
						Promise.resolve(getAssetToken(path)).then(setToken(node)),
					);

					return SKIP;
				}
				case "image": {
					// Full URL
					if (URL_REGEXP_PATTERN.test(node.url)) {
						return SKIP;
					}

					const path = node.url.split(SEPARATOR);

					promises.push(
						Promise.resolve(getAssetToken(path)).then(setToken(node)),
					);
					return SKIP;
				}
				case "imageReference": {
					const def = defs(node.identifier);
					if (!def) {
						return;
					}

					// Full URL
					if (URL_REGEXP_PATTERN.test(def.url)) {
						return SKIP;
					}

					const path = def.url.split(SEPARATOR);

					promises.push(
						Promise.resolve(getAssetToken(path)).then(setToken(node)),
					);
					return SKIP;
				}
			}
		},
	);

	await Promise.all(promises);
}
