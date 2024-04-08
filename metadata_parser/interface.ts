// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	DirectoryReader,
	DocumentMetadata,
	FileReader,
} from "../types.ts";

/**
 * Skip this parser.
 * If no parsers left, do not include the file in a document tree.
 */
export interface Skip {
	readonly skip: true;
}

export interface MetadataParser {
	/**
	 * Parses a file or directory then returns metadata for the file or directory.
	 * Throws when the file or directory does not meet the expectation.
	 */
	parse(
		fileOrDirectory: FileReader | DirectoryReader,
	): Promise<DocumentMetadata | Skip>;
}
