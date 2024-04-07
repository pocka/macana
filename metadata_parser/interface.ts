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
	 */
	readonly name: string;

	/**
	 * Human-readable text representing a title of the *document*.
	 * Although there is no restriction on available characters, you should avoid using
	 * control characters.
	 * ([Unicode control characters - Wikipedia](https://en.wikipedia.org/wiki/Unicode_control_characters))
	 */
	readonly title: string;

	/**
	 * Language for a document directory or a document.
	 * If this is empty, Macana looks up the most closest document directory language set.
	 * If none of the ancestors have a language, Macana will use a user given default language.
	 */
	readonly language?: string;
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
