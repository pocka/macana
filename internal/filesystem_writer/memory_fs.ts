// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { FileSystemWriter } from "./interface.ts";

const SEP = "/";

/**
 * Write contents to in-memory `Map` object.
 *
 * This is for testing: this class does not implement iterator
 * or a listing method. If you need in-memory abstraction or such,
 * write your own.
 */
export class MemoryFsWriter implements FileSystemWriter {
	#files: Map<string, Uint8Array> = new Map();

	async write(
		path: readonly string[],
		content: Uint8Array,
	): Promise<void> {
		const key = path.join(SEP);

		this.#files.set(key, content);
	}

	get(path: readonly string[]): Uint8Array | null {
		return this.#files.get(path.join(SEP)) ?? null;
	}
}
