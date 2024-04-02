// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { Document, DocumentDirectory, DocumentTree } from "./interface.ts";

function fmtDocumentSourceName(node: Document | DocumentDirectory): string {
	if ("file" in node) {
		return node.file.path.join("/");
	}

	return node.directory.path.join("/") + "/";
}

const LANG_SUBTAG_PATTERN = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/;

export function assertDocumentTreeIsValid(tree: DocumentTree): void {
	for (const [locale, entries] of tree.locales) {
		// Simple BCP 47 language tag check, based on RFC 4646 (Tags for Identifying Languages)
		// https://www.rfc-editor.org/rfc/rfc4646.txt
		if (!(LANG_SUBTAG_PATTERN.test(locale))) {
			throw new Error(`Invalid BCP 47 language tag, found "${locale}".`);
		}

		assertEntryNameIsUnique(entries);
	}
}

function assertEntryNameIsUnique(
	entries: ReadonlyArray<DocumentDirectory | Document>,
): void {
	entries.forEach((entry, i) => {
		const firstIndex = entries.findIndex((e) =>
			e.metadata.name === entry.metadata.name
		);
		if (firstIndex !== i) {
			throw new Error(
				"You can't have more than one document or directory that have same name: found " +
					`"${fmtDocumentSourceName(entries[firstIndex])}" and "${
						fmtDocumentSourceName(entry)
					}", ` +
					"which resulted in same document name.",
			);
		}

		if ("entries" in entry) {
			assertEntryNameIsUnique(entry.entries);
		}
	});
}
