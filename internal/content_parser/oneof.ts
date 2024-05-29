// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { ContentParser } from "./interface.ts";

/**
 * Combine multiple content parsers into one.
 *
 * It tries to parse the contents using given parsers and returns the first
 * successful result. If all of parsers failed, this parser throws the last
 * thrown error.
 */
export function oneof(...parsers: readonly ContentParser[]): ContentParser {
	return {
		async parse(...args) {
			let lastError: unknown;

			for (const parser of parsers) {
				try {
					return await parser.parse(...args);
				} catch (err) {
					lastError = err;
				}
			}

			throw lastError || new Error("All of parsers failed.");
		},
	};
}
