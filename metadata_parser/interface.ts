// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	DirectoryReader,
	FileReader,
} from "../filesystem_reader/interface.ts";

export interface DocumentMetadata {
	/**
	 * An identifier for a document, unique among a directory the document belongs to.
	 * A *document name* appears in a generated URL, thus available characters are limited to:
	 *
	 * - Alphabet (`a-z`, `A-Z`)
	 * - Digit (`0-9`)
	 * - Percent symbol (`%`)
	 * - Hyphen (`-`)
	 * - Dot (`.`)
	 * - Underscore (`_`)
	 * - Tilde (`~`)
	 */
	readonly name: string;

	/**
	 * Human-readable text representing a title of the *document*.
	 * Although there is no restriction on available characters, you should avoid using
	 * control characters.
	 * ([Unicode control characters - Wikipedia](https://en.wikipedia.org/wiki/Unicode_control_characters))
	 */
	readonly title: string;
}

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
