// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertExists,
	assertLess,
} from "../../deps/deno.land/std/assert/mod.ts";

import { MemoryFsWriter } from "./memory_fs.ts";
import { precompress } from "./precompress.ts";

Deno.test("Should save precompress files along with the original file", async () => {
	const mw = new MemoryFsWriter();

	const writer = precompress()(mw);

	const content = new TextEncoder().encode(`
		const loop = () => {
			const delta = getDelta();
			someMainThreadFunction();

			const input = getUserInput()

			if (input.leftButton.pressed) {
				player.x -= delta * player.speed;
			}

			if (input.rightButton.pressed) {
				player.x += delta * player.speed;
			}

			requestAnimationFrame(loop);
		}

		requestAnimationFrame(() => {
			loop()
		})
	`);

	await writer.write(["foo.js"], content);

	const original = mw.get(["foo.js"]);
	assertExists(original);

	const gzip = mw.get(["foo.js.gz"]);
	assertExists(gzip);

	const brotli = mw.get(["foo.js.br"]);
	assertExists(brotli);

	const zstd = mw.get(["foo.js.zst"]);
	assertExists(zstd);

	assertLess(gzip.byteLength, original.byteLength);
	assertLess(brotli.byteLength, original.byteLength);
	assertLess(zstd.byteLength, original.byteLength);
});
