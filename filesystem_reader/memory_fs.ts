// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { FileSystemReader } from "./interface.ts";
import type {
	DirectoryReader,
	FileReader,
	RootDirectoryReader,
} from "../types.ts";

interface InternalMetadata {
	updatedAt?: Date;
	createdAt?: Date;
}

interface FileBuilder {
	path: string | readonly string[];
	content: string | Uint8Array;
	metadata?: InternalMetadata;
}

const SEP = "/";

type InternalTree = Map<
	string,
	(readonly [Uint8Array, InternalMetadata]) | InternalTree
>;

/**
 * In-memory readonly filesystem.
 *
 * This is for testing.
 */
export class MemoryFsReader implements FileSystemReader {
	#tree: InternalTree;

	constructor(files: readonly FileBuilder[]) {
		this.#tree = new Map();

		const encoder = new TextEncoder();

		for (const file of files) {
			const path = typeof file.path === "string"
				? file.path.split(SEP)
				: file.path;
			const content = typeof file.content === "string"
				? encoder.encode(file.content)
				: file.content;

			this.#createRecur(path, content, file.metadata ?? {});
		}
	}

	#createRecur(
		path: readonly string[],
		content: Uint8Array,
		metadata: InternalMetadata,
		parent: InternalTree = this.#tree,
	): void {
		switch (path.length) {
			case 0:
				throw new Error("Path can't be empty");
			case 1: {
				const [name] = path;

				const existing = parent.get(name);
				if (existing && existing instanceof Map) {
					throw new Error(
						`Trying to create a file named "${name}", but directory with same name already exists.`,
					);
				}

				parent.set(name, [content, metadata]);
				return;
			}
			default: {
				const [name, ...rest] = path;

				let dir = parent.get(name);
				if (dir && dir instanceof Array) {
					throw new Error(
						`Trying to create a directory named "${name}", but file with same name already exists.`,
					);
				}

				if (!dir) {
					dir = new Map();
					parent.set(name, dir);
				}

				this.#createRecur(rest, content, metadata, dir);
				return;
			}
		}
	}

	#mapToReaders(
		map: InternalTree,
		parent: DirectoryReader | RootDirectoryReader,
	): Array<FileReader | DirectoryReader> {
		const readers: Array<FileReader | DirectoryReader> = [];

		for (const [name, contentOrSubTree] of map.entries()) {
			const path = parent.type === "root" ? [name] : [...parent.path, name];

			if (contentOrSubTree instanceof Map) {
				const dir: DirectoryReader = {
					type: "directory",
					name,
					path,
					parent,
					read: () =>
						Promise.resolve(this.#mapToReaders(contentOrSubTree, dir)),
					stat: () => ({}),
				};
				readers.push(dir);
				continue;
			}

			readers.push({
				type: "file",
				name,
				path,
				parent,
				read: () => Promise.resolve(contentOrSubTree[0]),
				stat: () => {
					return {
						createdAt: contentOrSubTree[1].createdAt,
						contentUpdatedAt: contentOrSubTree[1].updatedAt,
					};
				},
			});
		}

		return readers;
	}

	async #getAtRecur(
		path: readonly string[],
		parent: DirectoryReader | RootDirectoryReader,
	): Promise<FileReader | DirectoryReader> {
		switch (path.length) {
			case 0:
				throw new Error("MemoryFsReader: path cannot be empty");
			case 1: {
				const [name] = path;

				for (const child of await parent.read()) {
					if (child.name === name) {
						return child;
					}
				}

				const parentPath = parent.type === "root" ? [] : parent.path;

				throw new Error(
					`MemoryFsReader: file or directory not found at ${
						[...parentPath, name].join(SEP)
					}`,
				);
			}
			default: {
				const [name, ...rest] = path;

				for (const child of await parent.read()) {
					if (child.name === name) {
						if (child.type === "file") {
							throw new Error(
								`MemoryFsReader: ${child.path.join(SEP)} is directory`,
							);
						}

						return this.#getAtRecur(rest, child);
					}
				}

				const parentPath = parent.type === "root" ? [] : parent.path;

				throw new Error(
					`MemoryFsReader: file or directory not found at ${
						[...parentPath, name].join(SEP)
					}`,
				);
			}
		}
	}

	getRootDirectory(): Promise<RootDirectoryReader> {
		const root: RootDirectoryReader = {
			type: "root",
			read: () => Promise.resolve(this.#mapToReaders(this.#tree, root)),
			openFile: async (path) => {
				const file = await this.#getAtRecur(path, root);

				if (file.type === "directory") {
					throw new Error(`MemoryFsReader: ${path.join(SEP)} is directory`);
				}

				return file;
			},
			openDirectory: async (path) => {
				const dir = await this.#getAtRecur(path, root);

				if (dir.type === "file") {
					throw new Error(`MemoryFsReader: ${path.join(SEP)} is file`);
				}

				return dir;
			},
		};

		return Promise.resolve(root);
	}
}
