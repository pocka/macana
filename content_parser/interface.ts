// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	DocumentContent,
	DocumentMetadata,
	FileReader,
} from "../types.ts";

export interface ParseParameters {
	fileReader: FileReader;
	documentMetadata: DocumentMetadata;
}

export interface ContentParser {
	parse(params: ParseParameters): Promise<DocumentContent>;
}
