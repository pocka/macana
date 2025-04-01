// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { extname } from "../../deps/deno.land/std/path/mod.ts";
import type { Extension } from "../../deps/npm/mdast-util-from-markdown/mod.ts";
import type { State } from "../../deps/npm/mdast-util-to-hast/mod.ts";
import type * as Mdast from "../../deps/npm/mdast/types.ts";
import type * as Hast from "../../deps/npm/hast/types.ts";

export interface OfmWikilink extends Mdast.Node {
	type: "ofmWikilink";
	target: string;
	label: string | null;
}

export interface OfmWikilinkEmbed extends Mdast.Node {
	type: "ofmWikilinkEmbed";
	target: string;
	label: string | null;
}

export function ofmWikilinkFromMarkdown(): Extension {
	return {
		enter: {
			ofmWikilink(token) {
				this.enter({
					// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
					//                   which Deno does not support. APIs also don't accept type parameters.
					type: "ofmWikilink",
					target: "",
					label: null,
				}, token);
			},
			ofmWikilinkEmbed(token) {
				this.enter({
					// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
					//                   which Deno does not support. APIs also don't accept type parameters.
					type: "ofmWikilinkEmbed",
					target: "",
					label: null,
					data: {},
				}, token);
			},
			ofmWikilinkTarget(token) {
				const context = this.stack[this.stack.length - 1] as
					| Mdast.Nodes
					| OfmWikilink
					| OfmWikilinkEmbed
					| undefined;
				switch (context?.type) {
					case "ofmWikilink":
					case "ofmWikilinkEmbed": {
						context.target = this.sliceSerialize(token);
						return;
					}
					default: {
						throw new Error(`Unexpected wikilink target in ${context?.type}`);
					}
				}
			},
			ofmWikilinkLabel(token) {
				const context = this.stack[this.stack.length - 1] as
					| Mdast.Nodes
					| OfmWikilink
					| OfmWikilinkEmbed
					| undefined;
				switch (context?.type) {
					case "ofmWikilink":
					case "ofmWikilinkEmbed": {
						context.label = this.sliceSerialize(token);
						return;
					}
					default: {
						throw new Error(`Unexpected wikilink target in ${context?.type}`);
					}
				}
			},
		},
		exit: {
			ofmWikilink(token) {
				this.exit(token);
			},
			ofmWikilinkEmbed(token) {
				this.exit(token);
			},
		},
	};
}

function sizeProperties(node: Mdast.Node): { width?: number; height?: number } {
	return {
		width:
			node.data && "width" in node.data && typeof node.data.width === "number"
				? node.data.width
				: undefined,
		height:
			node.data && "height" in node.data && typeof node.data.height === "number"
				? node.data.height
				: undefined,
	};
}

export const ofmWikilinkToHastHandlers = {
	ofmWikilink(_state: State, node: OfmWikilink): Hast.Nodes {
		return {
			type: "element",
			tagName: "a",
			properties: {
				href: node.target,
			},
			children: [{ type: "text", value: node.label ?? node.target }],
		};
	},
	ofmWikilinkEmbed(_state: State, node: OfmWikilinkEmbed): Hast.Nodes {
		switch (extname(node.target).toLowerCase()) {
			case ".jpg":
			case ".jpeg":
			case ".avif":
			case ".bmp":
			case ".png":
			case ".svg":
			case ".webp": {
				return {
					type: "element",
					tagName: "img",
					properties: {
						...sizeProperties(node),
						src: node.target,
						alt: node.label ?? undefined,
					},
					children: [],
				};
			}
			case ".flac":
			case ".m4a":
			case ".mp3":
			case ".ogg":
			case ".wav":
			case ".3gp": {
				return {
					type: "element",
					tagName: "audio",
					properties: {
						src: node.target,
						title: node.label ?? undefined,
					},
					children: [],
				};
			}
			case ".mkv":
			case ".mov":
			case ".mp4":
			case ".ogv":
			case ".webm": {
				return {
					type: "element",
					tagName: "video",
					properties: {
						...sizeProperties(node),
						src: node.target,
						title: node.label ?? undefined,
					},
					children: [],
				};
			}
			default: {
				return {
					type: "element",
					tagName: "iframe",
					properties: {
						...sizeProperties(node),
						src: node.target,
						title: node.label ?? undefined,
					},
					children: [],
				};
			}
		}
	},
};
