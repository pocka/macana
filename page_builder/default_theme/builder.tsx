// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h, renderSSR } from "../../deps/deno.land/x/nano_jsx/mod.ts";

import type { BuildParameters, PageBuilder } from "../interface.ts";
import {
	macanaReplaceAssetTokens,
	macanaReplaceDocumentToken,
	type ObsidianMarkdownDocument,
} from "../../content_parser/obsidian_markdown.ts";
import type { JSONCanvasDocument } from "../../content_parser/json_canvas.ts";
import type { Document, DocumentDirectory, DocumentTree } from "../../types.ts";

import * as css from "./css.ts";

import * as Html from "./components/html.tsx";

import { PathResolverProvider } from "./contexts/path_resolver.tsx";

function isObsidianMarkdown(
	x: Document,
): x is Document<ObsidianMarkdownDocument> {
	return x.content.kind === "obsidian_markdown";
}

function isJSONCanvas(x: Document): x is Document<JSONCanvasDocument> {
	return x.content.kind === "json_canvas";
}

function toRelativePath(
	path: readonly string[],
	from: readonly string[],
): string {
	return Array.from({ length: from.length }, () => "../").join("") +
		path.join("/");
}

export interface Assets {
	globalCss: readonly string[];
	faviconSvg?: readonly string[];
	faviconPng?: readonly string[];
	siteLogo?: readonly string[];
}

interface InnerBuildParameters {
	item: DocumentDirectory | Document;

	tree: DocumentTree;

	parentLanguage: string;

	pathPrefix?: readonly string[];

	buildParameters: Omit<BuildParameters, "documentTree">;

	assets: Assets;
}

export interface DefaultThemeBuilderConstructorParameters {
	/**
	 * Copyright text to display at website footer.
	 * The page buidler does not add/subtract to the text: do not forget to
	 * include "Copyright" or "©".
	 */
	copyright: string;

	/**
	 * Path to the SVG file to use as a favicon from the root directory (FileSystem Reader).
	 */
	faviconSvg?: readonly string[];

	/**
	 * Path to the PNG file to use as a favicon from the root directory (FileSystem Reader).
	 */
	faviconPng?: readonly string[];

	/**
	 * Path to the website's logo or icon image from the root directory (FileSystem Reader).
	 */
	siteLogo?: readonly string[];
}

export class DefaultThemeBuilder implements PageBuilder {
	#copyright: string;
	#faviconSvg?: readonly string[];
	#faviconPng?: readonly string[];
	#siteLogo?: readonly string[];

	constructor(
		{ copyright, faviconSvg, faviconPng, siteLogo }:
			DefaultThemeBuilderConstructorParameters,
	) {
		this.#copyright = copyright;
		this.#faviconPng = faviconPng;
		this.#faviconSvg = faviconSvg;
		this.#siteLogo = siteLogo;
	}

	async build(
		{ documentTree, fileSystemReader, fileSystemWriter }: BuildParameters,
	) {
		const styles = css.serialize(
			Html.styles,
		);

		const assets: Assets = {
			globalCss: [".assets", "global.css"],
		};

		await fileSystemWriter.write(
			assets.globalCss,
			new TextEncoder().encode(styles),
		);

		const root = await fileSystemReader.getRootDirectory();

		if (this.#faviconSvg) {
			assets.faviconSvg = this.#faviconSvg;
			await fileSystemWriter.write(
				assets.faviconSvg,
				await (await root.openFile(this.#faviconSvg)).read(),
			);
		}

		if (this.#faviconPng) {
			assets.faviconPng = this.#faviconPng;
			await fileSystemWriter.write(
				assets.faviconPng,
				await (await root.openFile(this.#faviconPng)).read(),
			);
		}

		if (this.#siteLogo) {
			assets.siteLogo = this.#siteLogo;
			await fileSystemWriter.write(
				assets.siteLogo,
				await (await root.openFile(this.#siteLogo)).read(),
			);
		}

		const defaultPage = [...documentTree.defaultDocument.path, ""].join("/");
		const redirectHtml = [
			"<!DOCTYPE html>",
			"<html><head>",
			`<meta charset="utf-8">`,
			`<meta http-equiv="refresh" content="0; URL='${defaultPage}'">`,
			"</head><body>",
			// For cases when a user or UA disallows automatic redirection.
			`<a href="${defaultPage}">TOP</a>`,
			"</body></html>",
		].join("");
		await fileSystemWriter.write(
			["index.html"],
			new TextEncoder().encode(redirectHtml),
		);

		await Promise.all(documentTree.nodes.map((item) =>
			this.#build({
				item,
				tree: documentTree,
				parentLanguage: documentTree.defaultLanguage,
				pathPrefix: [],
				buildParameters: { fileSystemWriter, fileSystemReader },
				assets,
			})
		));
	}

	async #build(
		{ item, tree, parentLanguage, pathPrefix = [], buildParameters, assets }:
			InnerBuildParameters,
	): Promise<void> {
		const { fileSystemWriter } = buildParameters;

		if ("file" in item) {
			if (isObsidianMarkdown(item) || isJSONCanvas(item)) {
				const assetWrites: Promise<unknown>[] = [];

				if (item.content.kind === "obsidian_markdown") {
					await macanaReplaceAssetTokens(
						item.content.content,
						async (token) => {
							const file = tree.exchangeToken(token);

							assetWrites.push(fileSystemWriter.write(
								file.path,
								await file.read(),
							));

							return toRelativePath(file.path, item.path);
						},
					);

					await macanaReplaceDocumentToken(
						item.content.content,
						async (token) => {
							const document = tree.exchangeToken(token);

							return {
								path: toRelativePath([...document.path, ""], item.path),
							};
						},
					);
				}

				const html = "<!DOCTYPE html>" + renderSSR(
					() => (
						// Adds 1 to depth due to	`<name>/index.html` conversion.
						<PathResolverProvider depth={pathPrefix.length + 1}>
							<Html.View
								tree={tree}
								document={item}
								language={item.metadata.language || parentLanguage}
								copyright={this.#copyright}
								assets={assets}
							/>
						</PathResolverProvider>
					),
				);

				const enc = new TextEncoder();

				await Promise.all([
					...assetWrites,
					fileSystemWriter.write([
						...pathPrefix,
						item.metadata.name,
						"index.html",
					], enc.encode(html)),
				]);
				return;
			}

			throw new Error(`Unsupported content type: ${item.content.kind}`);
		}

		await Promise.all(item.entries.map((entry) =>
			this.#build({
				item: entry,
				tree,
				parentLanguage: item.metadata.language || parentLanguage,
				pathPrefix: [...pathPrefix, item.metadata.name],
				buildParameters,
				assets,
			})
		));
	}
}
