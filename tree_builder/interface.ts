// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { FileSystemReader } from "../filesystem_reader/interface.ts";
import type { MetadataParser } from "../metadata_parser/interface.ts";
import type { ContentParser } from "../content_parser/interface.ts";
import type { DocumentTree } from "../types.ts";

export interface BuildParameters {
	readonly fileSystemReader: FileSystemReader;
	readonly metadataParser: MetadataParser;
	readonly contentParser: ContentParser;
}

export interface TreeBuilder {
	build(opts: BuildParameters): Promise<DocumentTree>;
}
