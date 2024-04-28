// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { visit } from "../../../deps/esm.sh/unist-util-visit/mod.ts";
import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";
import type * as Hast from "../../../deps/esm.sh/hast/types.ts";
import { refractor } from "../../../deps/esm.sh/refractor/mod.ts";
import { h } from "../../../deps/esm.sh/hastscript/mod.ts";
import { type Handlers } from "../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

import { css } from "../css.ts";

const enum C {
	BlockContainer = "fm-code--bc",
	InlineCode = "fm-code--i",
	TokenKeyword = "fm-code--tk",
	TokenBuiltin = "fm-code--tb",
	TokenClassName = "fm-code--tc",
	TokenFunction = "fm-code--tf",
	TokenBoolean = "fm-code--tl",
	TokenNumber = "fm-code--tn",
	TokenString = "fm-code--ts",
	TokenChar = "fm-code--th",
	TokenSymbol = "fm-code--ty",
	TokenRegex = "fm-code--tr",
	TokenUrl = "fm-code--tu",
	TokenOperator = "fm-code--to",
	TokenVariable = "fm-code--tv",
	TokenConstant = "fm-code--ta",
	TokenProperty = "fm-code--tp",
	TokenPunctuation = "fm-code--tpu",
	TokenImportant = "fm-code--ti",
	TokenComment = "fm-code--tcm",
	TokenTag = "fm-code--tt",
	TokenAttrName = "fm-code--tan",
	TokenAttrValue = "fm-code--tav",
	TokenNamespace = "fm-code--tns",
	TokenProlog = "fm-code--tg",
	TokenDoctype = "fm-code--td",
	TokenCdata = "fm-code--tcd",
	TokenEntity = "fm-code--te",
	TokenBold = "fm-code--tbl",
	TokenItalic = "fm-code--til",
	TokenAtrule = "fm-code--tat",
	TokenSelector = "fm-code--tsl",
	TokenInserted = "fm-code--tin",
	TokenDeleted = "fm-code--tdl",
}

// https://prismjs.com/tokens.html
const prismTokenToClassMap = new Map<string, string>([
	["keyword", C.TokenKeyword],
	["builtin", C.TokenBuiltin],
	["class-name", C.TokenClassName],
	["function", C.TokenFunction],
	["boolean", C.TokenBoolean],
	["number", C.TokenNumber],
	["string", C.TokenString],
	["char", C.TokenChar],
	["symbol", C.TokenSymbol],
	["regex", C.TokenRegex],
	["url", C.TokenUrl],
	["operator", C.TokenOperator],
	["variable", C.TokenVariable],
	["constant", C.TokenConstant],
	["property", C.TokenProperty],
	["punctuation", C.TokenPunctuation],
	["important", C.TokenImportant],
	["comment", C.TokenComment],
	["tag", C.TokenTag],
	["attr-name", C.TokenAttrName],
	["attr-value", C.TokenAttrValue],
	["namespace", C.TokenNamespace],
	["prolog", C.TokenProlog],
	["doctype", C.TokenDoctype],
	["cdata", C.TokenCdata],
	["entity", C.TokenEntity],
	["bold", C.TokenBold],
	["italic", C.TokenItalic],
	["atrule", C.TokenAtrule],
	["selector", C.TokenSelector],
	["inserted", C.TokenInserted],
	["deleted", C.TokenDeleted],
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
	.${C.BlockContainer} {
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

	.${C.InlineCode} {
		margin: 0 0.2em;
		padding: calc(1rem / 4);
		font-family: monospace;
		font-size: 0.8rem;

		background-color: var(--color-bg-light);
		color: var(--color-fg-sub);
		border-radius: 4px;
	}

	.${C.TokenComment} {
		opacity: 0.65;
	}

	.${C.TokenString},
	.${C.TokenRegex},
	.${C.TokenAttrValue},
	.${C.TokenNumber} {
		color: var(--_accent);
	}

	.${C.TokenOperator},
	.${C.TokenVariable},
	.${C.TokenConstant} {
		color: var(--color-fg);
	}

	.${C.TokenFunction},
	.${C.TokenPunctuation},
	.${C.TokenClassName} {
		color: var(--color-fg-sub);
		opacity: 0.9;
	}

	.${C.TokenKeyword} {
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
				return h("pre", { class: C.BlockContainer }, [
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
					? className
					: className.split(" ");

				let replacedClassName: string | undefined;

				if (classNames.includes("token")) {
					replacedClassName = classNames.filter((c) => c !== "token").map(
						(c) => {
							return prismTokenToClassMap.get(c);
						},
					).filter((c) => !!c).join(" ");
				}

				node.properties.className = replacedClassName;
				if (typeof nodeTypeAttribute === "string") {
					node.properties[nodeTypeAttribute] = className;
				}
			});

			return h("pre", {
				class: [C.BlockContainer, className].filter((s): s is string => !!s)
					.join(" "),
				...(langNameAttribute ? { [langNameAttribute]: node.lang } : {}),
			}, [
				<code>{code.children as Hast.ElementContent[]}</code>,
			]);
		},
		inlineCode(_state, node: Mdast.InlineCode) {
			return h("code", { class: C.InlineCode }, [node.value]);
		},
	};
}
