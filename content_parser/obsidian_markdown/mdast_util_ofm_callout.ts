// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import type { Extension } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";
import { SKIP, visit } from "../../deps/esm.sh/unist-util-visit/mod.ts";
import type { State } from "../../deps/esm.sh/mdast-util-to-hast/mod.ts";
import type * as Hast from "../../deps/esm.sh/hast/types.ts";

export interface OfmCallout extends Mdast.Node {
	type: "ofmCallout";

	calloutType: string;

	isFoldable: boolean;

	defaultExpanded?: boolean;

	children: (OfmCalloutTitle | Mdast.BlockContent | Mdast.DefinitionContent)[];
}

export interface OfmCalloutTitle extends Mdast.Node {
	type: "ofmCalloutTitle";

	children: Mdast.PhrasingContent[];
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

	const titleChildren: Mdast.PhrasingContent[] = [
		titleTextRest
			? {
				type: "text",
				value: (titleTextRest || ""),
			} satisfies Mdast.Text
			: null,
		...titleRest,
	].filter((t): t is NonNullable<typeof t> => !!t);

	return {
		type: "ofmCallout",
		calloutType: type || "",
		isFoldable: !!expandSymbol,
		defaultExpanded: typeof expandSymbol === "string"
			? expandSymbol === "+"
			: undefined,
		children: [
			...(titleChildren.length > 0
				? [{
					type: "ofmCalloutTitle",
					children: titleChildren,
				}] as const
				: []),
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

function normalizeType(typeIdent: string) {
	switch (typeIdent.toLowerCase()) {
		case "abstract":
		case "summary":
		case "tldr":
			return "abstract";
		case "info":
			return "info";
		case "todo":
			return "todo";
		case "tip":
		case "hint":
		case "important":
			return "tip";
		case "success":
		case "check":
		case "done":
			return "success";
		case "question":
		case "help":
		case "faq":
			return "question";
		case "warning":
		case "caution":
		case "attention":
			return "warning";
		case "failure":
		case "fail":
		case "missing":
			return "failure";
		case "danger":
		case "error":
			return "danger";
		case "bug":
			return "bug";
		case "example":
			return "example";
		case "quote":
		case "cite":
			return "quote";
		default:
			return "note";
	}
}

export type CalloutType = ReturnType<typeof normalizeType>;

export interface OfmCalloutToHastHandlersOptions {
	generateTitleId?(count: number): string;

	generateIcon?(type: CalloutType): Hast.ElementContent | null;
}

function defaultTitleId(count: number): string {
	return `_ofm_callout__${count}`;
}

export function ofmCalloutToHastHandlers(
	{ generateTitleId = defaultTitleId, generateIcon }:
		OfmCalloutToHastHandlersOptions = {},
) {
	let counter = 0;

	return {
		ofmCallout(state: State, node: OfmCallout): Hast.Nodes {
			const titleTextTitleCased = node.calloutType.slice(0, 1).toUpperCase() +
				node.calloutType.slice(1).toLowerCase();
			const type = normalizeType(node.calloutType);

			const titleId = generateTitleId(counter++);

			const icon = generateIcon?.(type);

			let mdastTitle: OfmCalloutTitle | null = null;
			const mdastBody: (Mdast.BlockContent | Mdast.DefinitionContent)[] = [];
			for (const child of node.children) {
				if (child.type === "ofmCalloutTitle") {
					mdastTitle = child;
				} else {
					mdastBody.push(child);
				}
			}

			const title: Hast.ElementContent[] = mdastTitle
				? state.all({
					type: "paragraph",
					children: mdastTitle.children,
				})
				: [{
					type: "text",
					value: titleTextTitleCased,
				}];

			if (node.isFoldable) {
				return {
					type: "element",
					tagName: "aside",
					properties: {
						"data-ofm-callout-type": type,
						"aria-labelledby": titleId,
					},
					children: [
						{
							type: "element",
							tagName: "details",
							properties: {
								open: node.defaultExpanded ? "" : undefined,
							},
							children: [
								{
									type: "element",
									tagName: "summary",
									properties: {
										id: titleId,
									},
									children: [
										...(icon ? [icon] : []),
										...title,
									],
								},
								{
									type: "element",
									tagName: "div",
									properties: {},
									children: state.all(
										// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
										//                   which Deno does not support. APIs also don't accept type parameters.
										{ ...node, children: mdastBody } as OfmCallout,
									),
								},
							],
						},
					],
				};
			}

			return {
				type: "element",
				tagName: "aside",
				properties: {
					"data-ofm-callout-type": type,
					"aria-labelledby": titleId,
				},
				children: [
					{
						type: "element",
						tagName: "p",
						properties: {
							id: titleId,
						},
						children: [
							...(icon ? [icon] : []),
							...title,
						],
					},
					{
						type: "element",
						tagName: "div",
						properties: {},
						// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
						//                   which Deno does not support. APIs also don't accept type parameters.
						children: state.all(node),
					},
				],
			};
		},
	};
}
