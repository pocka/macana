// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SEPARATOR } from "../deps/deno.land/std/path/mod.ts";

import { logger } from "../logger.ts";

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
	): FileReader | DirectoryReader | null => {
		const { name, isSymlink, isFile } = dirEntry;

		const path = parent.type === "root" ? [name] : [...parent.path, name];

		if (isSymlink) {
			logger().warn(`Found symlink, skipping`, {
				path,
			});
			return null;
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
					const c = this.#fromDirEntry(entry, dir);
					if (c) {
						converted.push(c);
					}
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
					const c = this.#fromDirEntry(entry, root);
					if (c) {
						converted.push(c);
					}
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
					throw new Error(`DenoFsReader: file path cannot be empty`);
				}

				const parent = this.#constructParents(path, root);

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
			openDirectory: (path) => {
				const resolvedPath = this.#resolve(path);

				const stat = Deno.statSync(resolvedPath);
				if (!stat.isDirectory) {
					throw new Error(``);
				}

				if (!path.length) {
					throw new Error(`DenoFsReader: directory path cannot be empty`);
				}

				const parent = this.#constructParents(path, root);

				const name = path[path.length - 1];

				const dir: DirectoryReader = {
					type: "directory",
					name,
					path,
					parent,
					read: async () => {
						const converted: Array<FileReader | DirectoryReader> = [];

						for await (const entry of Deno.readDir(this.#resolve(path))) {
							const c = this.#fromDirEntry(entry, dir);
							if (c) {
								converted.push(c);
							}
						}

						return converted;
					},
				};

				return dir;
			},
		};

		return root;
	}

	#constructParents(
		path: readonly string[],
		root: RootDirectoryReader,
	): DirectoryReader | RootDirectoryReader {
		let parent: DirectoryReader | RootDirectoryReader = root;
		for (let i = 0, l = path.length - 1; i < l; i++) {
			const dir: DirectoryReader = {
				type: "directory",
				name: path[i],
				path: parent.type === "root" ? [path[i]] : [...parent.path, path[i]],
				parent,
				read: async () => {
					const converted: Array<FileReader | DirectoryReader> = [];

					for await (const entry of Deno.readDir(this.#resolve(path))) {
						const c = this.#fromDirEntry(entry, dir);
						if (c) {
							converted.push(c);
						}
					}

					return converted;
				},
			};

			parent = dir;
		}

		return parent;
	}
}
