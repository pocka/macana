// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { SKIP, visit } from "../../deps/esm.sh/unist-util-visit/mod.ts";
import { definitions } from "../../deps/esm.sh/mdast-util-definitions/mod.ts";

import type { ParseParameters } from "../interface.ts";
import type { DocumentToken } from "../../types.ts";

const SEPARATOR = "/";
const IGNORE_REGEXP_PATTERN = /^([a-z0-9]+:\/\/|#)/i;

function setDocumentToken(node: Mdast.Node, token: DocumentToken): void {
	node.data ??= {};
	// @ts-expect-error: incorrect library type definition.
	node.data.macanaDocumentToken = token;
}

/**
 * Searches document references and Marks thoese node by setting `macanaDocumentToken`
 * with Document Token.
 *
 * This function mutates the Mdast tree in place.
 */
export async function macanaMarkDocumentToken(
	tree: Mdast.Nodes,
	getDocumentToken: ParseParameters["getDocumentToken"],
): Promise<void> {
	const promises: Promise<unknown>[] = [];

	const defs = definitions(tree);

	visit(
		tree,
		(node) => node.type === "link" || node.type === "linkReference",
		(node) => {
			switch (node.type) {
				case "link": {
					if (IGNORE_REGEXP_PATTERN.test(node.url)) {
						return SKIP;
					}

					const path = node.url.split(SEPARATOR);

					const token = getDocumentToken(path);

					if (token instanceof Promise) {
						promises.push(token.then((t) => {
							setDocumentToken(node, t);
						}));
						return SKIP;
					}

					setDocumentToken(node, token);
					return SKIP;
				}
				case "linkReference": {
					const def = defs(node.identifier);
					if (!def) {
						return;
					}

					if (IGNORE_REGEXP_PATTERN.test(def.url)) {
						return SKIP;
					}

					const path = def.url.split(SEPARATOR);

					const token = getDocumentToken(path);

					if (token instanceof Promise) {
						promises.push(token.then((t) => {
							setDocumentToken(node, t);
						}));
						return SKIP;
					}

					setDocumentToken(node, token);
					return SKIP;
				}
			}
		},
	);
}
