// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface FileSystemWriter {
	write(
		path: readonly string[],
		content: Uint8Array,
	): Promise<void>;
}
