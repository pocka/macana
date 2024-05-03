// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { encodeHex } from "../deps/deno.land/std/encoding/hex.ts";

import type { FileSystemWriter } from "./interface.ts";

const SEP = "/";

/**
 * Skip duplicated file writes.
 *
 * This function wraps FileSystem Writer and returns a new FileSystem Writer
 * that skips duplicated file write operations.
 *
 * For example, bare FileSystem Writers perform two writes below:
 *
 * ```ts
 * const content = new TextEncoder().encode("Hello, World");
 *
 * const fsw = new DenoFsWriter(".dist");
 *
 * await fsw.write(["foo.txt"], content); // OS file write to .dist/foo.txt
 * await fsw.write(["foo.txt"], content); // OS file write to .dist/foo.txt
 * ```
 *
 * With this function, you can eliminate the second redundant call.
 *
 * ```ts
 * const content = new TextEncoder().encode("Hello, World");
 *
 * const fsw = noOverwrite(new DenoFsWriter(".dist"));
 *
 * await fsw.write(["foo.txt"], content); // OS file write to .dist/foo.txt
 * await fsw.write(["foo.txt"], content); // Function returns without actual file I/O
 * ```
 *
 * If the hash of content to write differs from the previous actual write,
 * this function throws an error.
 *
 * ```ts
 * const fsw = noOverwrite(new DenoFsWriter(".dist"));
 *
 * await fsw.write(["foo.txt"], new TextEncoder().encode("Hello, World")); // OS file write to .dist/foo.txt
 * await fsw.write(["foo.txt"], new TextEncoder().encode("Bye, World")); // Throws an error
 * ```
 *
 * @param childWriter - FileSystem Writer that performs actual write operation.
 * @returns Wrapped FileSystem Writer.
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
