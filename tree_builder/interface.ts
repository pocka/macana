// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	DirectoryReader,
	FileReader,
	FileSystemReader,
} from "../filesystem_reader/interface.ts";
import type {
	DocumentMetadata,
	MetadataParser,
} from "../metadata_parser/interface.ts";
import type {
	ContentParser,
	DocumentContent,
} from "../content_parser/interface.ts";

export interface Document {
	readonly type: "document";
	readonly metadata: DocumentMetadata;
	readonly file: FileReader;

	readonly content: DocumentContent;

	/**
	 * Document path: list of names, not file paths.
	 */
	readonly path: readonly string[];
}

export interface DocumentDirectory {
	readonly type: "directory";
	readonly metadata: DocumentMetadata;
	readonly directory: DirectoryReader;
	readonly entries: ReadonlyArray<Document | DocumentDirectory>;

	/**
	 * Document path: list of names, not file paths.
	 */
	readonly path: readonly string[];
}

export interface DocumentTree {
	readonly type: "tree";
	readonly nodes: ReadonlyArray<Document | DocumentDirectory>;

	readonly defaultLanguage: string;
}

export interface BuildParameters {
	readonly fileSystemReader: FileSystemReader;
	readonly metadataParser: MetadataParser;
	readonly contentParser: ContentParser;
}

export interface TreeBuilder {
	build(opts: BuildParameters): Promise<DocumentTree>;
}
