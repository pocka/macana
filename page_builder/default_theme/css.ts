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
