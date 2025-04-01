// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { minify_sync } from "../../../deps/npm/terser/mod.ts";

/**
 * Tagged template literal function for JavaScript code.
 *
 * This function returns minified code.
 */
export function javascript(
	tmpl: readonly string[],
	...params: readonly string[]
): string {
	const result = minify_sync(tmplBuilder(tmpl, params));
	if (!result.code) {
		throw new Error(
			"Failed to minify JavaScript code: Terser returned an empty code",
		);
	}

	return result.code;
}

function tmplBuilder(
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

	return thead + phead + tmplBuilder(trest, prest);
}
