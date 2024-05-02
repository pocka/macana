// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { JSONCanvas, Node } from "./types.ts";

export function mapNode<A, B = A>(
	tree: JSONCanvas<A>,
	f: (node: Node<A>) => Node<B>,
): JSONCanvas<B> {
	if (!tree.nodes?.map?.length) {
		// No nodes = no text nodes = Markdown type does not matter.
		return tree as unknown as JSONCanvas<B>;
	}

	const nodes = tree.nodes.map<Node<B>>((node) => {
		return f(node);
	});

	return {
		...tree,
		nodes,
	};
}

export async function mapNodeAsync<A, B = A>(
	tree: JSONCanvas<A>,
	f: (node: Node<A>) => Promise<Node<B>>,
): Promise<JSONCanvas<B>> {
	if (!tree.nodes?.map?.length) {
		// No nodes = no text nodes = Markdown type does not matter.
		return tree as unknown as JSONCanvas<B>;
	}

	const nodes = await Promise.all(tree.nodes.map<Promise<Node<B>>>((node) => {
		return f(node);
	}));

	return {
		...tree,
		nodes,
	};
}
