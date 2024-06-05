// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { extname } from "../../../../deps/deno.land/std/path/mod.ts";
import type * as Hast from "../../../../deps/esm.sh/hast/types.ts";
import type * as Mdast from "../../../../deps/esm.sh/mdast/types.ts";
import { h } from "../../../../deps/esm.sh/hastscript/mod.ts";
import { type State } from "../../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { type OfmWikilinkEmbed } from "../../../../lib/mdast_util_ofm_wikilink/mod.ts";
import type { Document } from "../../../types.ts";

import type { DocumentBuildContext } from "../context.ts";

import { hasAssetToken, hasDocumentToken } from "./utils.ts";

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

function getUrl(
	url: string,
	node: Mdast.Node,
	context: DocumentBuildContext,
): string {
	if (!hasAssetToken(node)) {
		return url;
	}

	const file = context.documentTree.exchangeToken(node.data.macanaAssetToken);

	context.copyFile(file);

	return context.resolveURL(file.path);
}

export interface EmbedHandlersParameters {
	context: DocumentBuildContext;

	buildDocumentContent(
		document: Document,
		fragments?: readonly string[],
	): Hast.Nodes;
}

export function embedHandlers(
	{ context, buildDocumentContent }: EmbedHandlersParameters,
) {
	return {
		image(_state: State, node: Mdast.Image) {
			return h("img", {
				...sizeProperties(node),
				src: getUrl(node.url, node, context),
				alt: node.alt,
			}, []);
		},
		imageReference(state: State, node: Mdast.ImageReference) {
			const def = state.definitionById.get(node.identifier.toUpperCase());
			if (!def) {
				throw new Error(`Orphaned image reference: id=${node.identifier}`);
			}

			return h("img", {
				...sizeProperties(node),
				src: getUrl(def.url, node, context),
				alt: node.alt,
			}, []);
		},
		ofmWikilinkEmbed(_state: State, node: OfmWikilinkEmbed) {
			// Document embed
			if (hasDocumentToken(node)) {
				const { document, fragments } = context.documentTree.exchangeToken(
					node.data.macanaDocumentToken,
					context.document,
				);

				const hast = buildDocumentContent(document, fragments);

				return h("div", {}, [hast]);
			}

			const path = getUrl(node.target, node, context);

			switch (extname(node.target).toLowerCase()) {
				case ".jpg":
				case ".jpeg":
				case ".avif":
				case ".bmp":
				case ".png":
				case ".svg":
				case ".webp": {
					return h("img", {
						...sizeProperties(node),
						src: path,
						alt: node.label ?? undefined,
					}, []);
				}
				case ".flac":
				case ".m4a":
				case ".mp3":
				case ".ogg":
				case ".wav":
				case ".3gp": {
					return h("audio", {
						src: path,
						title: node.label ?? undefined,
					}, []);
				}
				case ".mkv":
				case ".mov":
				case ".mp4":
				case ".ogv":
				case ".webm": {
					return h("video", {
						...sizeProperties(node),
						src: path,
						title: node.label ?? undefined,
					}, []);
				}
				default: {
					return h("iframe", {
						...sizeProperties(node),
						src: path,
						title: node.label ?? undefined,
					}, []);
				}
			}
		},
	};
}
