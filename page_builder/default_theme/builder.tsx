// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h, renderSSR } from "../../deps/deno.land/x/nano_jsx/mod.ts";
import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";

import { logger } from "../../logger.ts";

import type { BuildParameters, PageBuilder } from "../interface.ts";
import {
	macanaReplaceAssetTokens,
	macanaReplaceDocumentToken,
	type ObsidianMarkdownDocument,
} from "../../content_parser/obsidian_markdown.ts";
import type { JSONCanvasDocument } from "../../content_parser/json_canvas.ts";
import * as jsonCanvas from "../../content_parser/json_canvas/utils.ts";
import type {
	AssetToken,
	Document,
	DocumentDirectory,
	DocumentToken,
	DocumentTree,
} from "../../types.ts";

import * as css from "./css.ts";

import * as Html from "./components/html.tsx";
import * as HastRenderer from "./components/atoms/hast_renderer.tsx";

import { mapTocItem, tocMut } from "./hast/hast_util_toc_mut.ts";
import { PathResolverProvider } from "./contexts/path_resolver.tsx";

const DOCTYPE = "<!DOCTYPE html>";

function isAssetToken(token: unknown): token is AssetToken {
	return typeof token === "string" && token.startsWith("mxa_");
}

function isDocumentToken(token: unknown): token is DocumentToken {
	return typeof token === "string" && token.startsWith("mxt_");
}

function isObsidianMarkdown(
	x: Document,
): x is Document<ObsidianMarkdownDocument> {
	return x.content.kind === "obsidian_markdown";
}

function isJSONCanvas(
	x: Document,
): x is Document<JSONCanvasDocument<Mdast.Nodes>> {
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
	 * Website's name, title.
	 *
	 * The default theme display this text inside <title> tag.
	 */
	siteName: string;

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
	#siteName: string;

	constructor(
		{ copyright, faviconSvg, faviconPng, siteLogo, siteName }:
			DefaultThemeBuilderConstructorParameters,
	) {
		this.#copyright = copyright;
		this.#faviconPng = faviconPng;
		this.#faviconSvg = faviconSvg;
		this.#siteLogo = siteLogo;
		this.#siteName = siteName;
	}

	async build(
		{ documentTree, fileSystemReader, fileSystemWriter }: BuildParameters,
	) {
		const start = performance.now();

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

		const duration = performance.now() - start;
		logger().info(`Built with default theme in ${duration}ms`, {
			duration,
		});
	}

	async #build(
		{ item, tree, parentLanguage, pathPrefix = [], buildParameters, assets }:
			InnerBuildParameters,
	): Promise<void> {
		const { fileSystemWriter } = buildParameters;

		if ("file" in item) {
			if (isObsidianMarkdown(item) || isJSONCanvas(item)) {
				const enc = new TextEncoder();

				const basePath = [
					...pathPrefix,
					item.metadata.name,
				];

				const writeTasks: Promise<unknown>[] = [];

				switch (item.content.kind) {
					case "json_canvas": {
						const content = await jsonCanvas.mapNode(
							item.content.content,
							async (node) => {
								switch (node.type) {
									case "text": {
										await macanaReplaceAssetTokens(
											node.text,
											async (token) => {
												const file = tree.exchangeToken(token);

												writeTasks.push(fileSystemWriter.write(
													file.path,
													await file.read(),
												));

												return toRelativePath(file.path, item.path);
											},
										);

										await macanaReplaceDocumentToken(
											node.text,
											async (token) => {
												const document = tree.exchangeToken(token);

												return {
													path: toRelativePath(
														[...document.path, ""],
														item.path,
													),
												};
											},
										);

										return {
											...node,
											text: (
												<HastRenderer.View
													node={HastRenderer.mdastToHast(node.text)}
												/>
											),
										};
									}
									case "file": {
										if (isAssetToken(node.file)) {
											const file = tree.exchangeToken(node.file);

											writeTasks.push(
												fileSystemWriter.write(file.path, await file.read()),
											);

											return {
												...node,
												file: toRelativePath(file.path, item.path),
											};
										}

										if (isDocumentToken(node.file)) {
											const doc = tree.exchangeToken(node.file);

											return {
												...node,
												file: toRelativePath(
													[...doc.path, "embed.html"],
													item.path,
												),
											};
										}

										return node;
									}
									default: {
										return node;
									}
								}
							},
						);

						const document = item as Document<JSONCanvasDocument<Mdast.Nodes>>;

						const html = DOCTYPE + renderSSR(
							() => (
								// Adds 1 to depth due to	`<name>/index.html` conversion.
								<PathResolverProvider depth={pathPrefix.length + 1}>
									<Html.JSONCanvasView
										title={this.#siteName}
										tree={tree}
										copyright={this.#copyright}
										content={content}
										document={item}
										language={item.metadata.language || parentLanguage}
										assets={assets}
									/>
								</PathResolverProvider>
							),
						);

						writeTasks.push(
							fileSystemWriter.write([
								...basePath,
								"index.html",
							], enc.encode(html)),
						);

						const embed = DOCTYPE + renderSSR(
							() => (
								<PathResolverProvider depth={pathPrefix.length + 1}>
									<Html.JSONCanvasEmbed
										document={document}
										language={item.metadata.language || parentLanguage}
										content={content}
										assets={assets}
									/>
								</PathResolverProvider>
							),
						);

						writeTasks.push(
							fileSystemWriter.write([
								...basePath,
								"embed.html",
							], enc.encode(embed)),
						);

						await Promise.all(writeTasks);
						return;
					}
					case "obsidian_markdown": {
						await macanaReplaceAssetTokens(
							item.content.content,
							async (token) => {
								const file = tree.exchangeToken(token);

								writeTasks.push(fileSystemWriter.write(
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

						const document = item as Document<ObsidianMarkdownDocument>;
						const hast = HastRenderer.mdastToHast(item.content.content);
						const renderedNode = <HastRenderer.View node={hast} />;

						const html = DOCTYPE + renderSSR(
							() => (
								// Adds 1 to depth due to	`<name>/index.html` conversion.
								<PathResolverProvider depth={pathPrefix.length + 1}>
									<Html.ObsidianMarkdownView
										title={this.#siteName}
										document={item}
										language={item.metadata.language || parentLanguage}
										assets={assets}
										content={renderedNode}
										tree={tree}
										copyright={this.#copyright}
										toc={tocMut(hast).map((node) => {
											return mapTocItem(
												node,
												(item) => (
													<HastRenderer.View
														node={{ type: "root", children: item }}
														wrapAndStyle={false}
													/>
												),
											);
										})}
									/>
								</PathResolverProvider>
							),
						);

						writeTasks.push(
							fileSystemWriter.write([
								...basePath,
								"index.html",
							], enc.encode(html)),
						);

						const embed = DOCTYPE + renderSSR(
							() => (
								<PathResolverProvider depth={pathPrefix.length + 1}>
									<Html.ObsidianMarkdownEmbed
										document={document}
										language={item.metadata.language || parentLanguage}
										content={hast}
										assets={assets}
									/>
								</PathResolverProvider>
							),
						);

						writeTasks.push(
							fileSystemWriter.write([
								...basePath,
								"embed.html",
							], enc.encode(embed)),
						);

						await Promise.all(writeTasks);
						return;
					}
				}
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
