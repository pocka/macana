// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { dirname, SEPARATOR } from "../deps/deno.land/std/path/mod.ts";
import { encodeHex } from "../deps/deno.land/std/encoding/hex.ts";

import type { FileSystemWriter, WriteOptions } from "./interface.ts";

export class DenoFsWriter implements FileSystemWriter {
	#root: string;

	/**
	 * Map of path and SHA-256 hash
	 */
	#wroteHashes: Map<string, string> = new Map();

	/**
	 * Map of path and SHA-256 hash
	 */
	#writingHashes: Map<string, string> = new Map();

	constructor(rootDirectory: string | URL) {
		this.#root = typeof rootDirectory === "string"
			? rootDirectory
			: rootDirectory.pathname;

		// Append trailing slash for easy path resolving
		if (!(/[\\/]$/.test(this.#root))) {
			this.#root += SEPARATOR;
		}

		Deno.permissions.request({ name: "write", path: this.#root });
	}

	#resolve = (path: readonly string[]): string => {
		let normalized: string[] = [];

		for (const segment of path) {
			switch (segment) {
				case ".":
					break;
				case "..":
					// TODO: Abort for above the root traversal.
					normalized = normalized.slice(0, -1);
					break;
				default:
					normalized.push(segment);
					break;
			}
		}

		return this.#root + normalized.join(SEPARATOR);
	};

	async write(
		path: readonly string[],
		content: Uint8Array,
		opts: WriteOptions = {},
	) {
		const resolvedPath = this.#resolve(path);

		const hash = encodeHex(await crypto.subtle.digest("SHA-256", content));

		const wroteHash = this.#wroteHashes.get(resolvedPath);
		if (hash === wroteHash) {
			// Same content at same path, skip.
			return;
		}

		if (wroteHash && opts.errorOnOverwrite) {
			throw new Error(
				`Attempted to overwrite at "${resolvedPath}" (wrote: ${wroteHash}, attempt: ${hash})`,
			);
		}

		const writingHash = this.#writingHashes.get(resolvedPath);
		if (hash === writingHash) {
			// Same content at same path, skip.
			return;
		}

		if (writingHash) {
			throw new Error(
				`Attempted to interrupt ongoing write at "${resolvedPath}" (writing: ${writingHash}, attempt: ${hash})`,
			);
		}

		this.#writingHashes.set(resolvedPath, hash);

		try {
			await Deno.mkdir(dirname(resolvedPath), { recursive: true });
			await Deno.writeFile(resolvedPath, content);

			this.#wroteHashes.set(resolvedPath, hash);
		} finally {
			this.#writingHashes.delete(resolvedPath);
		}
	}
}
