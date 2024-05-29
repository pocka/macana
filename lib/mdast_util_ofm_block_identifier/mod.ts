// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { Extension } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import type { State } from "../../deps/esm.sh/mdast-util-to-hast/mod.ts";
import type * as Hast from "../../deps/esm.sh/hast/types.ts";
import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { visit } from "../../deps/esm.sh/unist-util-visit/mod.ts";

export interface OfmBlockIdentifier extends Mdast.Node {
	type: "ofmBlockIdentifier";

	/**
	 * Identifier name. This does not include the leading caret.
	 */
	value: string;
}

function isOfmBlockIdentifier(node: Mdast.Node): node is OfmBlockIdentifier {
	return node.type === "ofmBlockIdentifier";
}

export interface OfmBlockIdentifierFromMarkdownOptions {
	/**
	 * Whether to set the ID to the parent node, instead of leaving
	 * "ofmBlockIdentifier" node.
	 */
	hoist?: boolean;
}

export function ofmBlockIdentifierFromMarkdown(
	{ hoist = false }: OfmBlockIdentifierFromMarkdownOptions = {},
): Extension {
	return {
		enter: {
			ofmBlockIdentifierIdentifier(token) {
				const ident = this.sliceSerialize(token);

				this.enter(
					{
						type: "ofmBlockIdentifier",
						value: ident,
						data: {
							hName: "span",
							hProperties: {
								id: ident,
							},
						},
					} satisfies OfmBlockIdentifier as unknown as Mdast.Nodes,
					token,
				);
			},
		},
		exit: {
			ofmBlockIdentifierIdentifier(token) {
				this.exit(token);
			},
		},
		transforms: hoist
			? [
				(nodes) => {
					visit(nodes, (node) =>
						isOfmBlockIdentifier(node), (node, index, parent) => {
						if (
							!isOfmBlockIdentifier(node) || typeof index !== "number" ||
							!parent
						) {
							return;
						}

						parent.data = {
							...parent.data,
							hProperties: {
								id: (node as OfmBlockIdentifier).value,
								...(parent.data && "hProperties" in parent.data &&
										parent.data.hProperties || {}),
							},
						};

						parent.children.splice(index, 1);
						return;
					});
				},
			]
			: [],
	};
}

export interface OfmBlockIdentifierToHastHandlersOptions {
	/**
	 * A function takes an identifier string and returns value for `id` attribute.
	 */
	id?(identifier: string): string;
}

export function ofmBlockIdentifierToHastHandlers(
	{ id }: OfmBlockIdentifierToHastHandlersOptions = {},
) {
	return {
		ofmBlockIdentifier(_state: State, node: OfmBlockIdentifier): Hast.Nodes {
			return {
				type: "element",
				tagName: "span",
				properties: {
					id: id ? id(node.value) : node.value,
				},
				children: [],
			};
		},
	};
}
