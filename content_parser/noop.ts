// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { ContentParser, DocumentContent } from "./interface.ts";

export type NullDocument = DocumentContent<"null", null>;

// No-op parser for testing.
export const noopParser: ContentParser = {
	async parse(): Promise<NullDocument> {
		return {
			kind: "null",
			content: null,
		};
	},
};
