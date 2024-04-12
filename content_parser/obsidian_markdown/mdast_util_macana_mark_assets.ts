// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { SKIP, visit } from "../../deps/esm.sh/unist-util-visit/mod.ts";
import { definitions } from "../../deps/esm.sh/mdast-util-definitions/mod.ts";

import type { ParseParameters } from "../interface.ts";

const SEPARATOR = "/";
const URL_REGEXP_PATTERN = /^[a-z0-9]+:\/\//i;

/**
 * Searches asset references mark those node by setting `macanaAssetToken` with Asset Token.
 * This function modifies the Mdast tree in place.
 */
export async function macanaMarkAssets(
	tree: Mdast.Nodes,
	getAssetToken: ParseParameters["getAssetToken"],
): Promise<void> {
	const promises: Promise<unknown>[] = [];

	const defs = definitions(tree);

	visit(
		tree,
		(node) => node.type === "image" || node.type === "imageReference",
		(node) => {
			switch (node.type) {
				case "image": {
					// Full URL
					if (URL_REGEXP_PATTERN.test(node.url)) {
						return SKIP;
					}

					const path = node.url.split(SEPARATOR);

					promises.push(
						Promise.resolve(getAssetToken(path)).then((token) => {
							node.data ??= {};
							// @ts-expect-error: incorrect library type definition.
							node.data.macanaAssetToken = token;
						}),
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
						Promise.resolve(getAssetToken(path)).then((token) => {
							def.data ??= {};
							// @ts-expect-error: incorrect library type definition.
							def.data.macanaAssetToken = token;
						}),
					);
					return SKIP;
				}
			}
		},
	);

	await Promise.all(promises);
}
