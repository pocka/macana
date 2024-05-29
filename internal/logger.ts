// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getLogger } from "../deps/deno.land/std/log/mod.ts";

/**
 * @internal
 *
 * Logging interface for Macana internals.
 *
 * @module
 */

/**
 * @internal
 */
export function logger() {
	return getLogger("macana");
}
