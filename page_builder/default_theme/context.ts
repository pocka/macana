import type { Document, DocumentTree } from "../../types.ts";

export interface Assets {
	globalCss: readonly string[];
	faviconSvg?: readonly string[];
	faviconPng?: readonly string[];
	siteLogo?: readonly string[];
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
	 * Resolves the given path as an absolute path from the document root to
	 * relative path from the current document.
	 */
	resolvePath(to: readonly string[]): readonly string[];
}
