// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import type * as Hast from "../../../deps/esm.sh/hast/types.ts";
import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";
import { h } from "../../../deps/esm.sh/hastscript/mod.ts";
import {
	type Handlers,
	type State,
} from "../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { type OfmWikilink } from "../../../content_parser/obsidian_markdown/mdast_util_ofm_wikilink.ts";

import { buildClasses, css, join } from "../css.ts";
import * as lucide from "../icons/lucide.tsx";

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

export function linkHandlers(
	{ openExternalLinkInBlank = true }: LinkHandlersOptions = {},
): Handlers {
	return {
		link(state, node: Mdast.Link) {
			return link(node.url, state.all(node), { openExternalLinkInBlank });
		},
		linkReference(state, node: Mdast.LinkReference) {
			const def = state.definitionById.get(node.identifier);
			if (!def) {
				throw new Error(`Orphaned link reference: id=${node.identifier}`);
			}

			return link(def.url, state.all(node), { openExternalLinkInBlank });
		},
		// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		ofmWikilink(_state: State, node: OfmWikilink) {
			return link(node.target, [{
				type: "text",
				value: node.label ?? node.target,
			}], { openExternalLinkInBlank });
		},
	};
}
