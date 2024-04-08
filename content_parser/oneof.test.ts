// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertObjectMatch,
	unreachable,
} from "../deps/deno.land/std/assert/mod.ts";

import { VaultParser } from "../metadata_parser/vault_parser.ts";
import { MemoryFsReader } from "../filesystem_reader/memory_fs.ts";

import type { ContentParser } from "./interface.ts";
import { oneof } from "./oneof.ts";

function literal(x: string): ContentParser {
	return {
		async parse({ fileReader }) {
			const content = new TextDecoder().decode(await fileReader.read());

			if (content !== x) {
				throw new Error(`This is not ${x}, but ${content}`);
			}

			return {
				kind: x,
				content: x,
			};
		},
	};
}

Deno.test("Should combine parsers", async () => {
	const fs = new MemoryFsReader([
		{ path: "foo.md", content: "foo" },
		{ path: "bar.md", content: "bar" },
	]);

	const metadataParser = new VaultParser();

	const parser = oneof(
		literal("foo"),
		literal("bar"),
	);

	const root = await fs.getRootDirectory();

	let count: number = 0;

	for (const item of await root.read()) {
		if (item.type !== "file") {
			unreachable("MemoryFS gave a directory where expecting a file");
		}

		const metadata = await metadataParser.parse(item);
		if ("skip" in metadata) {
			unreachable(
				"Metadata Parser skipped where it expected to return metadata",
			);
		}

		const content = await parser.parse({
			documentMetadata: metadata,
			fileReader: item,
		});

		switch (count++) {
			case 0:
				assertObjectMatch(content, {
					kind: "foo",
					content: "foo",
				});
				break;
			case 1:
				assertObjectMatch(content, {
					kind: "bar",
					content: "bar",
				});
				break;
			default:
				unreachable("Unexpected iteration");
		}
	}
});
