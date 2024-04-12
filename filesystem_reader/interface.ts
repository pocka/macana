// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { RootDirectoryReader } from "../types.ts";

export interface FileSystemReader {
	/**
	 * Returns the topmost directory this FileSystem Reader can operate on.
	 */
	getRootDirectory(): Promise<RootDirectoryReader>;

	/**
	 * Directly read file contents at given path.
	 * Throws if path does not exist or found directory.
	 * You should traverse from `getRootDirectory()` for most cases.
	 * @deprecated Use `RootDirectoryReader.openFile` then `FileReader.read` instead.
	 */
	readFile(path: readonly string[]): Promise<Uint8Array>;
}
