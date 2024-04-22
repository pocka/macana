// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Hast from "../../deps/esm.sh/hast/types.ts";
import { raw } from "../../deps/esm.sh/hast-util-raw/mod.ts";
import { remove } from "../../deps/esm.sh/unist-util-remove/mod.ts";

const stripTags = ["script", "style", "title"];

function isElement(node: Hast.Node): node is Hast.Element {
	return node.type === "element";
}

/**
 * This function mutates Hast tree to somewhat align to Obsidian's HTML handling
 * inside Markdown document. This function does not guarantee or aim to 100% compatible
 * as Obsidian does not publish formal spec of their Markdown. Also their implementation
 * is quite buggy to the degree it's almost impossible to write compatible processor.
 */
export function ofmHtml(tree: Hast.Nodes): Hast.Nodes {
	const converted = raw(tree);

	// Using bare unist utility, as hast-util-sanitize cannot blacklist elements
	remove(converted, (node) => {
		return isElement(node) && stripTags.includes(node.tagName);
	});

	return converted;
}
