// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../../../deps/npm/mdast/types.ts";

import type { AssetToken, DocumentToken } from "../../../types.ts";

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

export function hasDocumentToken(
	node: Mdast.Node,
): node is typeof node & { data: { macanaDocumentToken: DocumentToken } } {
	return !!(node.data && ("macanaDocumentToken" in node.data) &&
		typeof node.data.macanaDocumentToken === "string" &&
		node.data.macanaDocumentToken.startsWith("mxt_"));
}

export function hasAssetToken(
	node: Mdast.Node,
): node is typeof node & { data: { macanaAssetToken: AssetToken } } {
	return !!(node.data && ("macanaAssetToken" in node.data) &&
		typeof node.data.macanaAssetToken === "string" &&
		node.data.macanaAssetToken.startsWith("mxa_"));
}
