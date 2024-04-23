// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { JSONCanvas, Node } from "./types.ts";

export async function mapNode<A, B = A>(
	tree: JSONCanvas<A>,
	f: (node: Node<A>) => Node<B> | Promise<Node<B>>,
): Promise<JSONCanvas<B>> {
	if (!tree.nodes?.map?.length) {
		// No nodes = no text nodes = Markdown type does not matter.
		return Promise.resolve(tree as unknown as JSONCanvas<B>);
	}

	const nodes = await Promise.all(
		tree.nodes.map<Promise<Node<B>>>(async (node) => {
			return await f(node);
		}),
	);

	return {
		...tree,
		nodes,
	};
}
