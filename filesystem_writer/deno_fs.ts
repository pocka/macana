// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { dirname, SEPARATOR } from "../deps/deno.land/std/path/mod.ts";

import { logger } from "../logger.ts";

import type { FileSystemWriter } from "./interface.ts";

export class DenoFsWriter implements FileSystemWriter {
	#root: string;
	#wroteHash: Map<string, Uint8Array> = new Map();

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
	) {
		const resolvedPath = this.#resolve(path);
		const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", content));
		const wrote = this.#wroteHash.get(resolvedPath);
		if (wrote) {
			if (!wrote.every((b, i) => hash[i] === b)) {
				throw new Error(
					`Attempt to write different content at ${resolvedPath}`,
				);
			}
			return;
		}

		this.#wroteHash.set(resolvedPath, hash);

		logger().debug(`Writing file at ${path.join(SEPARATOR)}`, {
			path,
			resolvedPath,
			bytes: content.byteLength,
		});

		await Deno.mkdir(dirname(resolvedPath), { recursive: true });
		await Deno.writeFile(resolvedPath, content);
	}
}
