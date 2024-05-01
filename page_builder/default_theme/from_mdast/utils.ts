// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";

export function getRequestedId<Node extends Mdast.Node>(
	node: Node,
): string | null {
	if (
		!node.data || !("hProperties" in node.data) ||
		typeof node.data.hProperties !== "object" || !node.data.hProperties
	) {
		return null;
	}

	if (
		!("id" in node.data.hProperties) ||
		typeof node.data.hProperties.id !== "string"
	) {
		return null;
	}

	return node.data.hProperties.id;
}
