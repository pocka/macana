import type { Document, DocumentTree, FileReader } from "../../types.ts";

export interface Assets {
	globalCss: readonly string[];
	faviconSvg?: readonly string[];
	faviconPng?: readonly string[];
	siteLogo?: readonly string[];
	openGraphImage?: readonly string[];
}

export interface BuildContext {
	/**
	 * The document currently building.
	 */
	document: Document;

	documentTree: DocumentTree;

	/**
	 * Current document's language.
	 *
	 * You should use this property instead of `document.metadata.language`.
	 * The document metadata only contains metadata defined by the document itself.
	 * If the document does not declare language and inherits from ancestor,
	 * the value of `document.metadata.language` would be `undefined`.
	 */
	language: string;

	/**
	 * Site-wide asset paths.
	 */
	assets: Readonly<Assets>;

	websiteTitle: string;

	copyright: string;

	/**
	 * Returns full URL, absolute path or relative path from the current
	 * document depends on a base URL.
	 */
	resolveURL(path: readonly string[]): string;

	/**
	 * Copy file to the output directory.
	 */
	copyFile(file: FileReader): void;
}
