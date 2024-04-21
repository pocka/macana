// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { JSONCanvas, Node, TextNode } from "./types.ts";

export function mapTextSync<A, B>(
	tree: JSONCanvas<A>,
	f: (node: TextNode<A>) => B,
): JSONCanvas<B> {
	if (!tree.nodes?.map?.length) {
		// No nodes = no text nodes = Markdown type does not matter.
		return (tree as unknown as JSONCanvas<B>);
	}

	const nodes = tree.nodes.map<Node<B>>((node) => {
		if (node.type !== "text") {
			return node;
		}

		return {
			...node,
			text: f(node),
		};
	});

	return {
		...tree,
		nodes,
	};
}

export async function mapText<A, B>(
	tree: JSONCanvas<A>,
	f: (node: TextNode<A>) => B | Promise<B>,
): Promise<JSONCanvas<B>> {
	if (!tree.nodes?.map?.length) {
		// No nodes = no text nodes = Markdown type does not matter.
		return Promise.resolve(tree as unknown as JSONCanvas<B>);
	}

	const nodes = await Promise.all(
		tree.nodes.map<Promise<Node<B>>>(async (node) => {
			if (node.type !== "text") {
				return node;
			}

			return {
				...node,
				text: await f(node),
			};
		}),
	);

	return {
		...tree,
		nodes,
	};
}
