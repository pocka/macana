// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as brotli from "../../deps/deno.land/x/brotli/mod.ts";
import * as zstd from "../../deps/deno.land/x/zstd_wasm/deno/zstd.ts";

import type { FileSystemWriter } from "./interface.ts";

type WriterFactory = (childWriter: FileSystemWriter) => FileSystemWriter;

function DEFAULT_IGNORE_FN(path: readonly string[]): boolean {
	const filename = path[path.length - 1];
	if (!filename) {
		// Something went wrong, but this middleware is not responsible for this case.
		return false;
	}

	return !(/\.(js|css|html)$/.test(filename));
}

/**
 * @param ext - File extension, *including* leading dot.
 */
function appendExt(path: readonly string[], ext: string): readonly string[] {
	const filename = path[path.length - 1];
	const dirname = path.slice(0, -1);

	if (!filename) {
		// Something went wrong, but this middleware is not responsible for this case.
		return path;
	}

	return [...dirname, filename + ext];
}

// TODO: Support compression options.
// TODO: Enable users to discard compressed file depends on compression ratio.
//       `discard?(compressed: Uint8Array, original: Uint8Array): boolean
interface PrecompressOptions {
	/**
	 * Whether to enable gzip compression.
	 * @default true
	 */
	gzip?: boolean;

	/**
	 * Whether to enable brotli compression.
	 * @default true
	 */
	brotli?: boolean;

	/**
	 * Whether to enable Zstandard compression.
	 * @default true
	 */
	zstd?: boolean;

	/**
	 * Minimum byte length to create compressed files.
	 * If the source file size is below this threshold, this middleware does not compress
	 * the file.
	 * By default, this middleware compresses regardless of the file size.
	 * @default 0
	 */
	minBytes?: number;

	/**
	 * If this callback function returned `true`, this middleware skips compression
	 * for the file.
	 * By default, this middleware skips files whose filename does not end with `.js`,
	 * `.html`, or `.css`.
	 */
	ignore?(path: readonly string[], content: Uint8Array): boolean;
}

/**
 * Wraps the given FileSystem Writer and returns a new FileSystem Writer
 * that produces additional gzip/brotli/Zstandard compressed files along with
 * the original file.
 *
 * Each compressed files have ".gz", ".br", ".zst" suffix, respectively.
 * This works well with Caddy's `precompressed` [0] directive.
 *
 * [0]: https://caddyserver.com/docs/caddyfile/directives/file_server#precompressed
 */
export function precompress(
	{
		gzip: enableGzip = true,
		brotli: enableBrotli = true,
		zstd: enableZstd = true,
		minBytes = 0,
		ignore = DEFAULT_IGNORE_FN,
	}: PrecompressOptions = {},
): WriterFactory {
	let isZstdInitCompleted = false;

	return (childWriter) => {
		return {
			async write(path, content) {
				if (ignore(path, content) || content.byteLength < minBytes) {
					return childWriter.write(path, content);
				}

				if (enableGzip) {
					const blob = new Blob([content]);
					const stream = blob.stream().pipeThrough(
						new CompressionStream("gzip"),
					);
					await childWriter.write(
						appendExt(path, ".gz"),
						new Uint8Array(await new Response(stream).arrayBuffer()),
					);
				}

				if (enableBrotli) {
					await childWriter.write(
						appendExt(path, ".br"),
						brotli.compress(content),
					);
				}

				if (enableZstd) {
					if (!isZstdInitCompleted) {
						await zstd.init();
						isZstdInitCompleted = true;
					}

					await childWriter.write(
						appendExt(path, ".zst"),
						zstd.compress(content, 10),
					);
				}

				return childWriter.write(path, content);
			},
		};
	};
}
