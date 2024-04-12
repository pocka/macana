// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	AssetToken,
	DocumentContent,
	DocumentMetadata,
	DocumentToken,
	FileReader,
} from "../types.ts";

export type ContentParseResult<
	Content extends DocumentContent = DocumentContent,
> = Content | {
	documentContent: Content;
	documentMetadata: DocumentMetadata;
};

export interface ParseParameters {
	fileReader: FileReader;
	documentMetadata: DocumentMetadata;

	getAssetToken(path: readonly string[]): AssetToken | Promise<AssetToken>;
	getDocumentToken(
		path: readonly string[],
	): DocumentToken | Promise<DocumentToken>;
}

export interface ContentParser {
	parse(params: ParseParameters): Promise<ContentParseResult>;
}
