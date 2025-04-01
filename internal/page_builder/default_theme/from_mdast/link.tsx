// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import type * as Hast from "../../../../deps/npm/hast/types.ts";
import type * as Mdast from "../../../../deps/npm/mdast/types.ts";
import { h } from "../../../../deps/npm/hastscript/mod.ts";
import {
	type Handlers,
	type State,
} from "../../../../deps/npm/mdast-util-to-hast/mod.ts";

import { type OfmWikilink } from "../../../../lib/mdast_util_ofm_wikilink/mod.ts";

import { buildClasses, css, join } from "../css.ts";
import * as lucide from "../icons/lucide.tsx";
import type { DocumentBuildContext } from "../context.ts";

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

	context: DocumentBuildContext;
}

interface LinkTarget {
	href: string;
	external: boolean;
}

function link(
	target: LinkTarget,
	children: Hast.ElementContent[],
	{ openExternalLinkInBlank }: LinkHandlersOptions,
) {
	if (!target.external) {
		return h("a", {
			class: c.anchor,
			href: target.href,
		}, children);
	}

	return h("a", {
		class: c.anchor,
		href: target.href,
		target: openExternalLinkInBlank ? "_blank" : undefined,
		rel: openExternalLinkInBlank ? "noopener" : undefined,
	}, [
		<span>{children}</span>,
		lucide.externalLink({ className: c.externalIcon, "aria-hidden": "true" }),
	]);
}

function getLinkTarget(
	url: string,
	node: Mdast.Node,
	context: DocumentBuildContext,
): LinkTarget {
	if (!hasDocumentToken(node)) {
		return {
			href: url,
			external: isExternal(url),
		};
	}

	const { document, fragments } = context.documentTree.exchangeToken(
		node.data.macanaDocumentToken,
		context.document,
	);

	const hash = fragments.length > 0
		? "#" + document.content.getHash(fragments)
		: "";

	const path = context.resolveURL([...document.path, ""]);

	return {
		href: path + hash,
		external: false,
	};
}

export function linkHandlers(
	{ openExternalLinkInBlank = true, context }: LinkHandlersOptions,
): Handlers {
	return {
		link(state, node: Mdast.Link) {
			return link(getLinkTarget(node.url, node, context), state.all(node), {
				openExternalLinkInBlank,
				context,
			});
		},
		linkReference(state, node: Mdast.LinkReference) {
			const def = state.definitionById.get(node.identifier.toUpperCase());
			if (!def) {
				throw new Error(`Orphaned link reference: id=${node.identifier}`);
			}

			return link(getLinkTarget(def.url, node, context), state.all(node), {
				openExternalLinkInBlank,
				context,
			});
		},
		// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		ofmWikilink(_state: State, node: OfmWikilink) {
			return link(getLinkTarget(node.target, node, context), [{
				type: "text",
				value: node.label ?? node.target,
			}], { openExternalLinkInBlank, context });
		},
	};
}
