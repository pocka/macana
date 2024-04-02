// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface FileReader {
	readonly type: "file";
	readonly name: string;
	readonly path: readonly string[];
	readonly parent: DirectoryReader | RootDirectoryReader;

	read(): Promise<Uint8Array>;
}

export interface DirectoryReader {
	readonly type: "directory";
	readonly name: string;
	readonly path: readonly string[];
	readonly parent: DirectoryReader | RootDirectoryReader;

	read(): Promise<ReadonlyArray<FileReader | DirectoryReader>>;
}

export interface RootDirectoryReader {
	readonly type: "root";

	read(): Promise<ReadonlyArray<FileReader | DirectoryReader>>;
}

export interface FileSystemReader {
	/**
	 * Returns the topmost directory this FileSystem Reader can operate on.
	 */
	getRootDirectory(): Promise<RootDirectoryReader>;
}
