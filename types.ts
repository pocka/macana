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
}

export interface DocumentContent<
	Kind extends string = string,
	Content = unknown,
> {
	kind: Kind;
	content: Content;
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
}
