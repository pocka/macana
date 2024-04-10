// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h, renderSSR } from "../../deps/deno.land/x/nano_jsx/mod.ts";

import type { BuildParameters, PageBuilder } from "../interface.ts";
import type { ObsidianMarkdownDocument } from "../../content_parser/obsidian_markdown.ts";
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

interface InnerBuildParameters {
	item: DocumentDirectory | Document;

	tree: DocumentTree;

	parentLanguage: string;

	pathPrefix?: readonly string[];

	buildParameters: Omit<BuildParameters, "documentTree">;
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
}

export class DefaultThemeBuilder implements PageBuilder {
	#copyright: string;
	#faviconSvg?: readonly string[];
	#faviconPng?: readonly string[];

	constructor(
		{ copyright, faviconSvg, faviconPng }:
			DefaultThemeBuilderConstructorParameters,
	) {
		this.#copyright = copyright;
		this.#faviconPng = faviconPng;
		this.#faviconSvg = faviconSvg;
	}

	async build(
		{ documentTree, fileSystemReader, fileSystemWriter }: BuildParameters,
	) {
		const styles = css.serialize(
			Html.styles,
		);

		await fileSystemWriter.write(
			["assets", "global.css"],
			new TextEncoder().encode(styles),
		);

		if (this.#faviconSvg) {
			await fileSystemWriter.write(
				["favicon.svg"],
				await (fileSystemReader.readFile(this.#faviconSvg)),
			);
		}

		if (this.#faviconPng) {
			await fileSystemWriter.write(
				["favicon.png"],
				await (fileSystemReader.readFile(this.#faviconPng)),
			);
		}

		await Promise.all(documentTree.nodes.map((item) =>
			this.#build({
				item,
				tree: documentTree,
				parentLanguage: documentTree.defaultLanguage,
				pathPrefix: [],
				buildParameters: { fileSystemWriter, fileSystemReader },
			})
		));
	}

	async #build(
		{ item, tree, parentLanguage, pathPrefix = [], buildParameters }:
			InnerBuildParameters,
	): Promise<void> {
		const { fileSystemWriter } = buildParameters;

		if ("file" in item) {
			if (isObsidianMarkdown(item) || isJSONCanvas(item)) {
				const html = "<!DOCTYPE html>" + renderSSR(
					() => (
						// Adds 1 to depth due to	`<name>/index.html` conversion.
						<PathResolverProvider depth={pathPrefix.length + 1}>
							<Html.View
								tree={tree}
								document={item}
								language={item.metadata.language || parentLanguage}
								copyright={this.#copyright}
								hasFaviconSvg={!!this.#faviconSvg}
								hasFaviconPng={!!this.#faviconPng}
							/>
						</PathResolverProvider>
					),
				);

				const enc = new TextEncoder();

				await fileSystemWriter.write([
					...pathPrefix,
					item.metadata.name,
					"index.html",
				], enc.encode(html));
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
			})
		));
	}
}
