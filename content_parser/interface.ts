// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { DocumentMetadata } from "../metadata_parser/interface.ts";
import type { FileReader } from "../filesystem_reader/interface.ts";

export interface DocumentContent<
	Kind extends string = string,
	Content = unknown,
> {
	kind: Kind;
	content: Content;
}

export interface ParseParameters {
	fileReader: FileReader;
	documentMetadata: DocumentMetadata;
}

export interface ContentParser {
	parse(params: ParseParameters): Promise<DocumentContent>;
}
