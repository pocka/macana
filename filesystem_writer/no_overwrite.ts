// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { encodeHex } from "../deps/deno.land/std/encoding/hex.ts";

import type { FileSystemWriter } from "./interface.ts";

const SEP = "/";

/**
 * Wraps the given FileSystem Writer and returns a new FileSystem Writer
 * that prevents writes to the same location with different content.
 * It also suppress redundant writes if the content hash is same.
 */
export function noOverwrite(childWriter: FileSystemWriter): FileSystemWriter {
	const hashes = new Map<string, string>();

	return {
		async write(path, content) {
			const key = path.join(SEP);
			const hash = encodeHex(await crypto.subtle.digest("SHA-256", content));

			const prev = hashes.get(key);
			if (!prev) {
				hashes.set(key, hash);
				return childWriter.write(path, content);
			}

			if (prev !== hash) {
				throw new Error(
					`Detected an attempt to write different content to "${key}":` +
						`first hash = ${prev}, second hash = ${hash}`,
				);
			}
		},
	};
}
