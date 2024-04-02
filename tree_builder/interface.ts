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

export interface Document {
	readonly metadata: DocumentMetadata;
	readonly file: FileReader;
}

export interface DocumentDirectory {
	readonly metadata: DocumentMetadata;
	readonly directory: DirectoryReader;
	readonly entries: ReadonlyArray<Document | DocumentDirectory>;
}

export interface DocumentTree {
	readonly locales: ReadonlyMap<
		string,
		ReadonlyArray<Document | DocumentDirectory>
	>;
}

export interface BuildParameters {
	readonly fileSystemReader: FileSystemReader;
	readonly metadataParser: MetadataParser;
}

export interface TreeBuilder {
	build(opts: BuildParameters): Promise<DocumentTree>;
}
