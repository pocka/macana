// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import type * as Hast from "../../../../deps/esm.sh/hast/types.ts";
import type * as Mdast from "../../../../deps/esm.sh/mdast/types.ts";
import { h } from "../../../../deps/esm.sh/hastscript/mod.ts";
import {
	type Handlers,
	type State,
} from "../../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { type OfmWikilink } from "../../../../lib/mdast_util_ofm_wikilink/mod.ts";

import { buildClasses, css, join } from "../css.ts";
import * as lucide from "../icons/lucide.tsx";
import type { BuildContext } from "../context.ts";

import { hasDocumentToken } from "./utils.ts";

function isExternal(urlOrPath: string): boolean {
	try {
		new URL(urlOrPath);
		return true;
	} catch {
		return false;
	}
}

const c = buildClasses("fm-li", ["anchor", "externalIcon"]);

export const linkStyles = join(
	lucide.lucideIconStyles,
	css`
		.${c.anchor} {
			font-weight: 500;

			color: var(--color-fg-sub);
			text-decoration: underline;

			transition: color 0.15s ease;
		}

		.${c.anchor}:hover {
			color: var(--color-primary);
		}

		.${c.externalIcon} {
			margin-inline-start: 0.25em;
		}
	`,
);

interface LinkHandlersOptions {
	/**
	 * Whether to set `target="_blank"` to anchor links pointing to
	 * external location.
	 */
	openExternalLinkInBlank?: boolean;

	context: BuildContext;
}

function link(
	urlOrPath: string,
	children: Hast.ElementContent[],
	{ openExternalLinkInBlank }: LinkHandlersOptions,
) {
	if (!isExternal(urlOrPath)) {
		return h("a", {
			class: c.anchor,
			href: urlOrPath,
		}, children);
	}

	return h("a", {
		class: c.anchor,
		href: urlOrPath,
		target: openExternalLinkInBlank ? "_blank" : undefined,
		rel: openExternalLinkInBlank ? "noopener" : undefined,
	}, [
		<span>{children}</span>,
		lucide.externalLink({ className: c.externalIcon, "aria-hidden": "true" }),
	]);
}

function getUrl(url: string, node: Mdast.Node, context: BuildContext): string {
	if (!hasDocumentToken(node)) {
		return url;
	}

	const { document, fragments } = context.documentTree.exchangeToken(
		node.data.macanaDocumentToken,
		context.document,
	);

	const hash = fragments.length > 0
		? "#" + document.content.getHash(fragments)
		: "";

	const path = context.resolveURL([...document.path, ""]);

	return path + hash;
}

export function linkHandlers(
	{ openExternalLinkInBlank = true, context }: LinkHandlersOptions,
): Handlers {
	return {
		link(state, node: Mdast.Link) {
			return link(getUrl(node.url, node, context), state.all(node), {
				openExternalLinkInBlank,
				context,
			});
		},
		linkReference(state, node: Mdast.LinkReference) {
			const def = state.definitionById.get(node.identifier.toUpperCase());
			if (!def) {
				throw new Error(`Orphaned link reference: id=${node.identifier}`);
			}

			return link(getUrl(def.url, node, context), state.all(node), {
				openExternalLinkInBlank,
				context,
			});
		},
		// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		ofmWikilink(_state: State, node: OfmWikilink) {
			return link(getUrl(node.target, node, context), [{
				type: "text",
				value: node.label ?? node.target,
			}], { openExternalLinkInBlank, context });
		},
	};
}
