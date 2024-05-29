// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as hCSS from "../../../deps/deno.land/x/hyperactive_css/mod.ts";

export interface Css {
	readonly chunks: ReadonlySet<string>;
}

/**
 * Just for syntax highlighting.
 */
export function css(
	tmpl: readonly string[],
	...params: readonly string[]
): Css {
	const code = cssTmplBuilder(tmpl, params);

	return {
		chunks: new Set([code]),
	};
}

export function fromString(code: string): Css {
	return {
		chunks: new Set([code]),
	};
}

function cssTmplBuilder(
	tmpl: readonly string[],
	params: readonly string[],
): string {
	if (!tmpl.length) {
		return "";
	}

	const [thead, ...trest] = tmpl;

	if (!params.length || trest.length === 0) {
		return thead;
	}

	const [phead, ...prest] = params;

	return thead + phead + cssTmplBuilder(trest, prest);
}

export function join(...units: readonly Css[]): Css {
	const result = new Set<string>();

	// `Set.prototype.union` method is not widely implemented yet.
	for (const unit of units) {
		for (const chunk of unit.chunks) {
			result.add(chunk);
		}
	}

	return {
		chunks: result,
	};
}

export function serialize(css: Css): string {
	return Array.from(css.chunks.values()).join("\n");
}

/**
 * Join class names.
 */
export function cx(
	...classNames: (string | null | false | undefined)[]
): string {
	return classNames.filter((c): c is string => !!c).join(" ");
}

/**
 * This function returns an object whose every propery value is
 * class name string.
 *
 * The purpose of this function is to create namespaced (scoped)
 * class while keeping short character count for class name strings.
 *
 * As this function uses indices for class names, removing a name
 * from the list may cause broken style if a user loads stale CSS
 * and fresh HTML (or vice-versa). In order to avoid this, you can
 * replace the obsolete name with `null`, so this function skips
 * the index that later names keep its indices.
 *
 * @example
 * const c = buildClasses("foo", ["bar", null, "baz"]);
 * assertEquals(c.bar, "foo__0");
 * assertEquals(c.baz, "foo__2");
 */
export function buildClasses<Name extends string | null>(
	prefix: string,
	names: readonly Name[],
): Record<Exclude<Name, null>, string> {
	return Object.fromEntries(
		names.map((name, i) => name ? [name, `${prefix}__${i.toString(31)}`] : null)
			.filter((entry): entry is NonNullable<typeof entry> => !!entry),
	);
}

export interface CSSAssets {
	paths: readonly string[];

	replace(fn: (from: string) => string): string;
}

export function getAssets(code: string): CSSAssets {
	const ast = hCSS.parseAStylesheet(code);

	const assets = ast.rules.map((rule) => parseRule(rule)).flat().filter(
		(token) => {
			// URL
			if (/^[a-z0-9]+:/.test(token.value)) {
				return false;
			}

			// Absolute URL
			if (token.value.startsWith("/")) {
				return false;
			}

			return true;
		},
	);

	return {
		paths: assets.map((token) => token.value).filter((x, i, arr) =>
			arr.indexOf(x) === i
		),
		replace(f) {
			const ordered = assets.sort((a, b) =>
				b.debug.from.offset - a.debug.from.offset
			);

			let ret = code;
			for (const token of ordered) {
				if (token instanceof hCSS.StringToken) {
					ret = ret.slice(0, token.debug.from.offset + 1) + `"` +
						f(token.value) +
						`"` + ret.slice(token.debug.to.offset + 1);
				} else {
					ret = ret.slice(0, token.debug.from.offset + 1) + `url(` +
						f(token.value) +
						`)` + ret.slice(token.debug.to.offset + 1);
				}
			}

			return ret;
		},
	};
}

function parseRule(
	rule: hCSS.CSSParserRule,
): readonly (hCSS.URLToken | hCSS.StringToken)[] {
	if (rule instanceof hCSS.AtRule) {
		return [
			...rule.rules.map((rule) => parseRule(rule)).flat(),
			...rule.declarations.map((rule) => parseRule(rule)).flat(),
		];
	}

	if (rule instanceof hCSS.QualifiedRule) {
		return rule.declarations.map((decl) => parseRule(decl)).flat();
	}

	if (rule instanceof hCSS.Declaration) {
		return rule.value.map((value) => parseToken(value)).flat();
	}

	return [];
}

function parseToken(
	token: hCSS.CSSParserToken,
): readonly (hCSS.URLToken | hCSS.StringToken)[] {
	if (token instanceof hCSS.URLToken) {
		return [token];
	}

	if (token instanceof hCSS.SimpleBlock) {
		return token.value.map((block) => parseToken(block)).flat();
	}

	if (token instanceof hCSS.Func) {
		// hyperactivecss cannot parse `url("...")` as an URL token
		if (token.name === "url") {
			return token.value.filter((t): t is hCSS.StringToken =>
				t instanceof hCSS.StringToken
			);
		}

		return token.value.map((token) => parseToken(token)).flat();
	}

	return [];
}
