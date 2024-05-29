// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { extname } from "../../../deps/deno.land/std/path/mod.ts";
import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";
import { SKIP, visit } from "../../../deps/esm.sh/unist-util-visit/mod.ts";
import { definitions } from "../../../deps/esm.sh/mdast-util-definitions/mod.ts";

import type { ParseParameters } from "../interface.ts";
import type { DocumentToken } from "../../types.ts";

import type {
	OfmWikilink,
	OfmWikilinkEmbed,
} from "../../../lib/mdast_util_ofm_wikilink/mod.ts";

const SEPARATOR = "/";
const FRAGMENT_PREFIX = "#";
const IGNORE_REGEXP_PATTERN = /^([a-z0-9]+:\/\/|#)/i;

function setDocumentToken(node: Mdast.Node, token: DocumentToken): void {
	node.data ??= {};
	// @ts-expect-error: incorrect library type definition.
	node.data.macanaDocumentToken = token;
}

function parseInternalLink(
	link: string,
): { path: readonly string[]; fragments: readonly string[] } {
	const [ref, ...fragments] = link.split(FRAGMENT_PREFIX);

	return {
		path: (ref || "").split(SEPARATOR),
		fragments: fragments,
	};
}

/**
 * Searches document references and Marks thoese node by setting `macanaDocumentToken`
 * with Document Token.
 *
 * This function mutates the Mdast tree in place.
 *
 * In order to correctly mark document embeds, run this function before
 * `macanaMarkAssets`.
 */
export async function macanaMarkDocumentToken(
	tree: Mdast.Nodes | OfmWikilink | OfmWikilinkEmbed,
	getDocumentToken: ParseParameters["getDocumentToken"],
): Promise<void> {
	const promises: Promise<unknown>[] = [];

	const defs = definitions(tree as Mdast.Nodes);

	visit(
		tree,
		(node) =>
			node.type === "link" || node.type === "linkReference" ||
			node.type === "ofmWikilink" || node.type === "ofmWikilinkEmbed",
		(node) => {
			switch (node.type) {
				case "ofmWikilinkEmbed": {
					const { path, fragments } = parseInternalLink(node.target);

					if (extname(path[path.length - 1])) {
						// File embeds
						return SKIP;
					}

					const token = getDocumentToken(path, fragments);

					if (token instanceof Promise) {
						promises.push(token.then((t) => {
							setDocumentToken(node, t);
						}));
						return SKIP;
					}

					setDocumentToken(node, token);
					return SKIP;
				}
				case "ofmWikilink": {
					const { path, fragments } = parseInternalLink(node.target);

					const token = getDocumentToken(path, fragments);

					if (token instanceof Promise) {
						promises.push(token.then((t) => {
							setDocumentToken(node, t);
						}));
						return SKIP;
					}

					setDocumentToken(node, token);
					return SKIP;
				}
				case "link": {
					if (IGNORE_REGEXP_PATTERN.test(node.url)) {
						return SKIP;
					}

					const { path, fragments } = parseInternalLink(node.url);

					const token = getDocumentToken(path, fragments);

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

					const { path, fragments } = parseInternalLink(def.url);

					const token = getDocumentToken(path, fragments);

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

	if (promises.length > 0) {
		await Promise.all(promises);
	}
}
