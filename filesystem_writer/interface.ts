// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface WriteOptions {
	/**
	 * If this flag is on, the write operation aborts if the target path is already written.
	 */
	errorOnOverwrite?: boolean;
}

export interface FileSystemWriter {
	write(
		path: readonly string[],
		content: Uint8Array,
		options?: WriteOptions,
	): Promise<void>;
}
