// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { SKIP, visit } from "../../deps/esm.sh/unist-util-visit/mod.ts";

import type { OfmWikilinkEmbed } from "./mdast_util_ofm_wikilink.ts";

const SEPARATOR = "|";
const SIZE_ATTR_REGEXP_PATTERN = /^([1-9][0-9]*)(x([1-9][0-9]*))?$/;

function parseSegment(
	segment: string,
): { width: number; height: number | null } | null {
	const match = segment.match(SIZE_ATTR_REGEXP_PATTERN);
	if (!match) {
		return null;
	}

	const wStr = match[1];
	const hStr = match[3];

	const width = parseInt(wStr, 10);
	const height = typeof hStr === "string" ? parseInt(hStr, 10) : null;

	// Reject invalid values
	if (
		!Number.isFinite(width) || width <= 0 ||
		(typeof height === "number" && (!Number.isFinite(height) || height <= 0))
	) {
		return null;
	}

	return { width, height };
}

function setSizeToNode(node: Mdast.Node, width: number, height: number | null) {
	node.data ??= {};

	// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
	//                   which Deno does not support. APIs also don't accept type parameters.
	node.data.width = width;

	if (typeof height === "number") {
		// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		node.data.height = height;
	}

	// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
	//                   which Deno does not support. APIs also don't accept type parameters.
	node.data.hProperties = {
		// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		...node.data.hProperties ?? {},
		width,
		height: typeof height === "number" ? height : undefined,
	};
}

/**
 * This function parses Obsidian's image size attribute extension, and modifies
 * image label and data in-place.
 *
 * @param tree - Tree to change. This function mutates this argument.
 */
export function ofmImageSize(tree: Mdast.Nodes | OfmWikilinkEmbed): void {
	visit(tree, (node) => {
		return node.type === "image" || node.type === "imageReference" ||
			node.type === "ofmWikilinkEmbed";
	}, (node) => {
		switch (node.type) {
			case "image":
			case "imageReference": {
				if (!node.alt) {
					return SKIP;
				}

				const segments = node.alt.split(SEPARATOR);

				switch (segments.length) {
					case 1: {
						const result = parseSegment(segments[0]);
						if (!result) {
							return SKIP;
						}

						setSizeToNode(node, result.width, result.height);
						return;
					}
					case 2: {
						const [alt, segment] = segments;
						const result = parseSegment(segment);
						if (!result) {
							return SKIP;
						}

						setSizeToNode(node, result.width, result.height);

						node.alt = alt;

						return;
					}
					default: {
						return SKIP;
					}
				}
			}
			case "ofmWikilinkEmbed": {
				if (!node.label) {
					return SKIP;
				}

				const result = parseSegment(node.label);
				if (!result) {
					return SKIP;
				}

				setSizeToNode(node, result.width, result.height);
				return SKIP;
			}
		}
	});
}
