// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { RootDirectoryReader } from "../types.ts";

export interface FileSystemReader {
	/**
	 * Returns the topmost directory this FileSystem Reader can operate on.
	 */
	getRootDirectory(): Promise<RootDirectoryReader>;
}
