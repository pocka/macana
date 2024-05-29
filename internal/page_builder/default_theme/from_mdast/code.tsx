// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { visit } from "../../../../deps/esm.sh/unist-util-visit/mod.ts";
import type * as Mdast from "../../../../deps/esm.sh/mdast/types.ts";
import type * as Hast from "../../../../deps/esm.sh/hast/types.ts";
import { refractor } from "../../../../deps/esm.sh/refractor/mod.ts";
import { h } from "../../../../deps/esm.sh/hastscript/mod.ts";
import { type Handlers } from "../../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { buildClasses, css } from "../css.ts";

const c = buildClasses("fm-cd", [
	"blockContainer",
	"inlineCode",
	// https://prismjs.com/tokens.html
	"keyword",
	"builtin",
	"class-name",
	"function",
	"boolean",
	"number",
	"string",
	"char",
	"symbol",
	"regex",
	"url",
	"operator",
	"variable",
	"constant",
	"property",
	"punctuation",
	"important",
	"comment",
	"tag",
	"attr-name",
	"attr-value",
	"namespace",
	"prolog",
	"doctype",
	"cdata",
	"entity",
	"bold",
	"italic",
	"atrule",
	"selector",
	"inserted",
	"deleted",
]);

// This highlighting style is inspired by https://github.com/Alligator/accent.vim
// Code block intentionally breaks vertical rhythm: while code block contents is
// textual, they are normally interrupts main contents' flow by default and needs
// to stand out. In addition to that, reading code written in vertical rhythm is
// simply a pain...
// TODO: Make tabsize configurable (build config and runtime option if possible)
// TODO: Make font-family configurable
// TODO: Make accent color configurable
export const codeStyles = css`
	.${c.blockContainer} {
		--_accent: var(--color-primary);

		tab-size: 4ch;
		margin: 0;
		margin-top: calc(var(--baseline) * 1rem);
		padding: calc(var(--baseline) * 0.5rem) 1em;
		line-height: 1.5;
		max-width: 100%;
		font-size: 1rem;
		font-family: monospace;
		font-size: 0.9rem;

		background-color: var(--color-bg-light);
		color: var(--color-fg);
		border-radius: 4px;
		overflow-x: auto;
	}

	.${c.inlineCode} {
		margin: 0 0.2em;
		padding: calc(1rem / 4);
		font-family: monospace;
		font-size: 0.8rem;

		background-color: var(--color-bg-light);
		color: var(--color-fg-sub);
		border-radius: 4px;
	}

	.${c.comment} {
		opacity: 0.65;
	}

	.${c.string},
	.${c.regex},
	.${c["attr-value"]},
	.${c.number} {
		color: var(--_accent);
	}

	.${c.operator},
	.${c.variable},
	.${c.constant} {
		color: var(--color-fg);
	}

	.${c.function},
	.${c.punctuation},
	.${c["class-name"]} {
		color: var(--color-fg-sub);
		opacity: 0.9;
	}

	.${c.keyword} {
		color: var(--color-fg-sub);
		font-weight: bold;
	}
`;

function isValidClassName(value: unknown): value is string | readonly string[] {
	if (typeof value === "string") {
		return true;
	}

	if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
		return true;
	}

	return false;
}

export interface CodeHandlersOptions {
	/**
	 * Class name to add to the container element.
	 * `null` to not setting class.
	 * This is for user writing their own styles. Macana sets its own class
	 * to the generated `<pre>` element.
	 *
	 * @default null
	 */
	className?: string | null;

	/**
	 * Attribute name to set space separated list of node type (e.g. "token", "string", "comment").
	 * `null` to not set node types to attribute.
	 *
	 * @default null
	 */
	nodeTypeAttribute?: string | null;

	/**
	 * Attribute name to set language name (e.g. "css", "html")
	 * `null` to not set language name to attribute.
	 *
	 * @default null
	 */
	langNameAttribute?: string | null;
}

export function codeHandlers({
	className = null,
	nodeTypeAttribute = null,
	langNameAttribute = null,
}: CodeHandlersOptions = {}): Handlers {
	return {
		code(_state, node: Mdast.Code) {
			if (!node.lang || !refractor.registered(node.lang)) {
				return h("pre", { class: c.blockContainer }, [
					<code>{node.value}</code>,
				]);
			}

			const code = refractor.highlight(node.value, node.lang);
			visit(code, (node) => node.type === "element", (node) => {
				if (node.type !== "element") {
					return;
				}

				if (!node.properties || !isValidClassName(node.properties.className)) {
					return;
				}

				const className = node.properties.className;
				if (!className) {
					return;
				}

				const classNames = Array.isArray(className)
					? (className as string[])
					: className.split(" ");

				let replacedClassName: string | undefined;

				if (classNames.includes("token")) {
					replacedClassName = classNames.filter((c) => c !== "token").map(
						(className) => {
							return className in c ? c[className as keyof typeof c] : null;
						},
					).filter((c) => !!c).join(" ");
				}

				node.properties.className = replacedClassName;
				if (typeof nodeTypeAttribute === "string") {
					node.properties[nodeTypeAttribute] = className;
				}
			});

			return h("pre", {
				class: [c.blockContainer, className].filter((s): s is string => !!s)
					.join(" "),
				...(langNameAttribute ? { [langNameAttribute]: node.lang } : {}),
			}, [
				<code>{code.children as Hast.ElementContent[]}</code>,
			]);
		},
		inlineCode(_state, node: Mdast.InlineCode) {
			return h("code", { class: c.inlineCode }, [node.value]);
		},
	};
}
