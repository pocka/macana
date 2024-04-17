// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import type { Extension } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import { SKIP, visit } from "../../deps/esm.sh/unist-util-visit/mod.ts";

export interface OfmCallout extends Mdast.Node {
	type: "ofmCallout";

	calloutType: string;

	isFoldable: boolean;

	defaultExpanded?: boolean;

	title: Mdast.PhrasingContent[];

	children: (Mdast.BlockContent | Mdast.DefinitionContent)[];
}

const PATTERN_REGEXP = /\[!(\S+)]([-+]?)(\s(.*))?$/;

function splitNodeAtFirstNewline<Node extends Mdast.Nodes>(
	node: Node,
): (readonly [Node, Node]) | null {
	if (node.type === "text") {
		const idx = node.value.indexOf("\n");
		if (idx < 0) {
			return null;
		}

		const left: Mdast.Text = {
			type: "text",
			data: node.data,
			position: node.position && {
				start: node.position.start,
				end: {
					line: node.position.start.line,
					column: node.position.start.column + idx,
				},
			},
			value: node.value.slice(0, idx),
		};

		const right: Mdast.Text = {
			type: "text",
			data: node.data,
			position: node.position && {
				start: {
					line: node.position.start.line + 1,
					column: 0,
				},
				end: node.position.end,
			},
			value: node.value.slice(idx + 1, node.value.length),
		};

		return [
			// @ts-expect-error: TypeScript cannot narrow return type when its generic.
			//                   https://github.com/microsoft/TypeScript/issues/23132
			//                   https://github.com/microsoft/TypeScript/issues/33912
			left,
			// @ts-expect-error: TypeScript cannot narrow return type when its generic.
			//                   https://github.com/microsoft/TypeScript/issues/23132
			//                   https://github.com/microsoft/TypeScript/issues/33912
			right,
		];
	}

	if (!("children" in node)) {
		return null;
	}

	for (let i = 0, l = node.children.length; i < l; i++) {
		const result = splitNodeAtFirstNewline(node.children[i]);
		if (!result) {
			continue;
		}

		return [
			{
				...node,
				children: [
					...node.children.slice(0, i),
					result[0],
				],
			},
			{
				...node,
				children: [
					result[1],
					...node.children.slice(i + 1),
				],
			},
		];
	}

	return null;
}

function replace(node: Mdast.Blockquote): OfmCallout | null {
	if (!node.children.length) {
		return null;
	}

	const [head, ...rest] = node.children;
	if (head.type !== "paragraph" || !head.children.length) {
		return null;
	}

	const splitted = splitNodeAtFirstNewline(head) ?? [head, null];

	const [titleHead, ...titleRest] = splitted[0].children;
	if (titleHead.type !== "text") {
		return null;
	}

	const match = titleHead.value.match(PATTERN_REGEXP);
	if (!match) {
		return null;
	}

	const [, type, expandSymbol, , titleTextRest] = match;

	return {
		type: "ofmCallout",
		calloutType: type || "",
		isFoldable: !!expandSymbol,
		defaultExpanded: typeof expandSymbol === "string"
			? expandSymbol === "+"
			: undefined,
		title: [
			titleTextRest
				? {
					type: "text",
					value: (titleTextRest || ""),
				} satisfies Mdast.Text
				: null,
			...titleRest,
		].filter((t): t is NonNullable<typeof t> => !!t),
		children: [
			...(splitted[1] ? [splitted[1]] : []),
			...rest,
		],
	};
}

/**
 * Extension for Callout extension from Obsidian Flavored Markdown.
 * This adds "ofmCallout" node.
 *
 * ```markdown
 * > [!info]
 * > Callout block
 *
 * > [!check]- title
 * > Default collapsed callout block
 * ```
 */
export function ofmCalloutFromMarkdown(): Extension {
	return {
		transforms: [
			(root) => {
				visit(
					root,
					(node) => node.type === "blockquote",
					(node, index, parent) => {
						if (!parent || typeof index !== "number") {
							// Root node, unreachable
							return;
						}

						const replaced = replace(node as Mdast.Blockquote);

						if (!replaced) {
							return SKIP;
						}

						// @ts-expect-error: unist-related libraries heavily relies on ambiend module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						parent.children[index] = replaced;
					},
				);
			},
		],
	};
}
