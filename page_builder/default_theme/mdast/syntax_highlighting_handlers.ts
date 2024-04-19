// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { visit } from "../../../deps/esm.sh/unist-util-visit/mod.ts";
import { refractor } from "../../../deps/esm.sh/refractor/mod.ts";
import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";
import type * as Hast from "../../../deps/esm.sh/hast/types.ts";
import {
	defaultHandlers,
	type State,
} from "../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

function isValidClassName(value: unknown): value is string | readonly string[] {
	if (typeof value === "string") {
		return true;
	}

	if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
		return true;
	}

	return false;
}

interface SyntaxHighlightingOptions {
	/**
	 * Class name to add to the container element.
	 * `null` to not setting class.
	 *
	 * @default "macana--highlight"
	 */
	className?: string | null;

	/**
	 * Attribute name to set space separated list of node type (e.g. "token", "string", "comment").
	 * `null` to not set node types to attribute.
	 *
	 * @default "data-hl-node"
	 */
	nodeTypeAttribute?: string | null;

	/**
	 * Attribute name to set language name (e.g. "css", "html")
	 * `null` to not set language name to attribute.
	 *
	 * @default "data-hl-lang"
	 */
	langNameAttribute?: string | null;
}

export function syntaxHighlightingHandlers({
	className = "macana--highlight",
	nodeTypeAttribute = "data-hl-node",
	langNameAttribute = "data-hl-lang",
}: SyntaxHighlightingOptions = {}) {
	return {
		code(state: State, node: Mdast.Code): Hast.Nodes {
			if (!node.lang || !refractor.registered(node.lang)) {
				return defaultHandlers.code(state, node);
			}

			const code = refractor.highlight(node.value, node.lang);
			visit(code, (node) => node.type === "element", (node) => {
				if (node.type !== "element") {
					return;
				}

				if (!node.properties || !isValidClassName(node.properties.className)) {
					return;
				}

				const className = node.properties.className;
				node.properties.className = undefined;
				if (typeof nodeTypeAttribute === "string") {
					node.properties[nodeTypeAttribute] = className;
				}
			});

			return {
				type: "element",
				tagName: "pre",
				properties: {
					className,
					...(langNameAttribute ? { [langNameAttribute]: node.lang } : {}),
				},
				children: [
					{
						type: "element",
						tagName: "code",
						properties: {},
						// @ts-expect-error: refractor relys on @types/hast@2.x, which is not compatible the latest v3
						children: code.children,
					},
				],
			};
		},
	};
}
