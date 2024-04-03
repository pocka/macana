// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { FileSystemWriter, WriteOptions } from "./interface.ts";

const SEP = "/";

export class MemoryFsWriter implements FileSystemWriter {
	#files: Map<string, Uint8Array> = new Map();

	async write(
		path: readonly string[],
		content: Uint8Array,
		opts: WriteOptions = {},
	): Promise<void> {
		const key = path.join(SEP);

		if (opts.errorOnOverwrite) {
			if (this.#files.has(key)) {
				throw new Error(`Attempt to overwrite file at "${key}"`);
			}
		}

		this.#files.set(key, content);
	}

	get(path: readonly string[]): Uint8Array | null {
		return this.#files.get(path.join(SEP)) ?? null;
	}
}
