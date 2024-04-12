// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SEPARATOR } from "../deps/deno.land/std/path/mod.ts";

import type { FileSystemReader } from "./interface.ts";
import type {
	DirectoryReader,
	FileReader,
	RootDirectoryReader,
} from "../types.ts";

export class DenoFsReader implements FileSystemReader {
	#root: string;

	constructor(rootDirectory: string | URL) {
		this.#root = typeof rootDirectory === "string"
			? rootDirectory
			: rootDirectory.pathname;

		// Append trailing slash for easy path resolving
		if (!(/[\\/]$/.test(this.#root))) {
			this.#root += SEPARATOR;
		}
	}

	#resolve = (path: readonly string[]): string => {
		let normalized: string[] = [];

		for (const segment of path) {
			switch (segment) {
				case ".":
					break;
				case "..":
					// TODO: Abort for above the root traversal.
					normalized = normalized.slice(0, -1);
					break;
				default:
					normalized.push(segment);
					break;
			}
		}

		return this.#root + normalized.join(SEPARATOR);
	};

	#fromDirEntry = (
		dirEntry: Deno.DirEntry,
		parent: DirectoryReader | RootDirectoryReader,
	): FileReader | DirectoryReader => {
		const { name, isSymlink, isFile } = dirEntry;

		const path = parent.type === "root" ? [name] : [...parent.path, name];

		if (isSymlink) {
			// TODO: Log warning and skip.
			throw new Error("DenoFsReader does not support reading symlinks.");
		}

		if (isFile) {
			return {
				type: "file",
				name,
				path,
				parent,
				read: () => {
					return Deno.readFile(this.#resolve(path));
				},
			};
		}

		const dir: DirectoryReader = {
			type: "directory",
			name,
			path,
			parent,
			read: async () => {
				const converted: Array<FileReader | DirectoryReader> = [];

				for await (const entry of Deno.readDir(this.#resolve(path))) {
					converted.push(this.#fromDirEntry(entry, dir));
				}

				return converted;
			},
		};

		return dir;
	};

	async getRootDirectory(): Promise<RootDirectoryReader> {
		await Deno.permissions.request({ name: "read", path: this.#root });

		const root: RootDirectoryReader = {
			type: "root",
			read: async () => {
				const converted: Array<FileReader | DirectoryReader> = [];

				for await (const entry of Deno.readDir(this.#root)) {
					converted.push(this.#fromDirEntry(entry, root));
				}

				return converted;
			},
			openFile: (path) => {
				const resolvedPath = this.#resolve(path);

				const fileInfo = Deno.statSync(resolvedPath);
				if (!fileInfo.isFile) {
					throw new Error(`DenoFsReader: ${resolvedPath} is not a file`);
				}

				if (!path.length) {
					throw new Error(`DenoFsReader: path cannot be empty`);
				}

				let parent: DirectoryReader | RootDirectoryReader = root;
				for (let i = 0, l = path.length - 1; i < l; i++) {
					const dir: DirectoryReader = {
						type: "directory",
						name: path[i],
						path: parent.type === "root"
							? [path[i]]
							: [...parent.path, path[i]],
						parent,
						read: async () => {
							const converted: Array<FileReader | DirectoryReader> = [];

							for await (const entry of Deno.readDir(this.#resolve(path))) {
								converted.push(this.#fromDirEntry(entry, dir));
							}

							return converted;
						},
					};

					parent = dir;
				}

				const file = path[path.length - 1];

				return {
					type: "file",
					name: file,
					path,
					parent,
					read: async () => {
						return Deno.readFile(resolvedPath);
					},
				};
			},
		};

		return root;
	}

	async readFile(path: readonly string[]): Promise<Uint8Array> {
		return await Deno.readFile(this.#resolve(path));
	}
}
