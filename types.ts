// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface FileSystemStats {
	contentUpdatedAt?: Date;
	createdAt?: Date;
}

export interface FileReader {
	readonly type: "file";
	readonly name: string;
	readonly path: readonly string[];
	readonly parent: DirectoryReader | RootDirectoryReader;

	read(): Promise<Uint8Array>;

	stat(): FileSystemStats | Promise<FileSystemStats>;
}

export interface DirectoryReader {
	readonly type: "directory";
	readonly name: string;
	readonly path: readonly string[];
	readonly parent: DirectoryReader | RootDirectoryReader;

	read(): Promise<ReadonlyArray<FileReader | DirectoryReader>>;

	stat(): FileSystemStats | Promise<FileSystemStats>;
}

export type DocumentToken = `mxt_${string}`;

export type AssetToken = `mxa_${string}`;

export interface RootDirectoryReader {
	readonly type: "root";

	read(): Promise<ReadonlyArray<FileReader | DirectoryReader>>;

	/**
	 * Returns a file at the path.
	 * This function may throw an error if the file not found.
	 */
	openFile(path: readonly string[]): Promise<FileReader> | FileReader;

	/**
	 * Returns a directory at the path.
	 * This function may throw an error if the directory not found.
	 */
	openDirectory(
		path: readonly string[],
	): Promise<DirectoryReader> | DirectoryReader;
}

export interface DocumentMetadata {
	/**
	 * An identifier for a document, unique among a directory the document belongs to.
	 */
	readonly name: string;

	/**
	 * Human-readable text representing a title of the *document*.
	 * Although there is no restriction on available characters, you should avoid using
	 * control characters.
	 * ([Unicode control characters - Wikipedia](https://en.wikipedia.org/wiki/Unicode_control_characters))
	 */
	readonly title: string;

	/**
	 * Language for a document directory or a document.
	 * If this is empty, Macana looks up the most closest document directory language set.
	 * If none of the ancestors have a language, Macana will use a user given default language.
	 */
	readonly language?: string;

	/**
	 * Whether this document is the default document for the entire document tree.
	 * The behavior of when multiple documents have this property set to true is undefined.
	 * This property does not take an effect for document tree.
	 */
	readonly isDefaultDocument?: boolean;

	/**
	 * Datetime when the document or the document directory created at.
	 */
	readonly createdAt?: Date;

	/**
	 * Datetime when the document or the document directory last updated at.
	 */
	readonly updatedAt?: Date;
}

export interface DocumentContent<
	Kind extends string = string,
	Content = unknown,
> {
	kind: Kind;

	content: Content;

	/**
	 * Returns hash part of the URL matchin to the selectors.
	 * Format of selector differs by content types.
	 *
	 * If the document does not have section matching to the selectors,
	 * this function throws an error.
	 */
	getHash(selectors: readonly string[]): string;
}

export interface Document<Content extends DocumentContent = DocumentContent> {
	readonly type: "document";
	readonly metadata: DocumentMetadata;
	readonly file: FileReader;

	readonly content: Content;

	/**
	 * Document path: list of names, not file paths.
	 */
	readonly path: readonly string[];
}

export interface DocumentDirectory {
	readonly type: "directory";
	readonly metadata: DocumentMetadata;
	readonly directory: DirectoryReader;
	readonly entries: ReadonlyArray<Document | DocumentDirectory>;

	/**
	 * Document path: list of names, not file paths.
	 */
	readonly path: readonly string[];
}

export interface DocumentTree {
	readonly type: "tree";
	readonly nodes: ReadonlyArray<Document | DocumentDirectory>;

	readonly defaultLanguage: string;

	/**
	 * Representive, facade document.
	 */
	readonly defaultDocument: Document;

	/**
	 * Get a document in exchange for the token.
	 * Throws an error if the token is invalid or target document is missing.
	 */
	exchangeToken(token: DocumentToken): {
		document: Document;
		fragments: readonly string[];
	};

	/**
	 * Get an asset file in exchange for the token.
	 * Throws an error if the token is invalid or target file is missing.
	 */
	exchangeToken(token: AssetToken): FileReader;
}
