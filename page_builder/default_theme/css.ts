// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

interface Css {
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
