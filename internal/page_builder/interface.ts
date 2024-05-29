// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { FileSystemWriter } from "../filesystem_writer/interface.ts";
import type { FileSystemReader } from "../filesystem_reader/interface.ts";
import type { DocumentTree } from "../types.ts";

export interface BuildParameters {
	readonly documentTree: DocumentTree;
	readonly fileSystemReader: FileSystemReader;
	readonly fileSystemWriter: FileSystemWriter;
}

export interface PageBuilder {
	/**
	 * Builds pages from document tree then write them to the filesystem.
	 */
	build(params: BuildParameters): Promise<void>;
}
