// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { toHtml } from "../../deps/esm.sh/hast-util-to-html/mod.ts";

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
import { globalStyles } from "./global_styles.ts";
import type { Assets, BuildContext } from "./context.ts";

import { tocMut } from "./hast/hast_util_toc_mut.ts";

import {
	fromMdast,
	fromMdastStyles,
	style as styleMarkdownContent,
} from "./from_mdast/mod.ts";
import { indexRedirect } from "./pages/index_redirect.tsx";
import {
	markdownEmbed,
	markdownPage,
	markdownPageStyles,
} from "./pages/markdown.tsx";
import {
	jsonCanvasEmbed,
	jsonCanvasPage,
	jsonCanvasPageStyles,
} from "./pages/json_canvas.tsx";

export type { BuildContext } from "./context.ts";

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

/**
 * @param from - **Directory** to resolve from.
 */
function toRelativePath(
	path: readonly string[],
	from: readonly string[],
): readonly string[] {
	return [
		...Array.from({ length: from.length }, () => ".."),
		...path,
	];
}

function toRelativePathString(
	path: readonly string[],
	from: readonly string[],
): string {
	return toRelativePath(path, from).join("/");
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
			css.join(
				globalStyles,
				fromMdastStyles,
				markdownPageStyles,
				jsonCanvasPageStyles,
			),
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
		const redirectHtml = toHtml(indexRedirect({ redirectTo: defaultPage }));
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
			const context: BuildContext = {
				document: item,
				documentTree: tree,
				language: item.metadata.language || parentLanguage,
				assets,
				websiteTitle: this.#siteName,
				copyright: this.#copyright,
				resolvePath(to) {
					// This page builder transforms path to "Foo/Bar.md" to "Foo/Bar/(index.html)"
					return toRelativePath(to, item.path);
				},
			};

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

												return toRelativePathString(file.path, item.path);
											},
										);

										await macanaReplaceDocumentToken(
											node.text,
											async (token) => {
												const { document, fragments } = tree.exchangeToken(
													token,
												);

												const hash = fragments.length > 0
													? "#" + document.content.getHash(fragments)
													: "";

												return {
													path: toRelativePathString(
														[...document.path, ""],
														item.path,
													) + hash,
												};
											},
										);

										return {
											...node,
											text: fromMdast(node.text),
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
												file: toRelativePathString(file.path, item.path),
											};
										}

										if (isDocumentToken(node.file)) {
											const { document, fragments } = tree.exchangeToken(
												node.file,
											);

											const hash = fragments.length > 0
												? "#" + document.content.getHash(fragments)
												: "";

											return {
												...node,
												file: toRelativePathString(
													[...document.path, "embed.html"],
													item.path,
												) + hash,
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

						const html = toHtml(jsonCanvasPage({
							content,
							context,
						}));

						writeTasks.push(
							fileSystemWriter.write([
								...basePath,
								"index.html",
							], enc.encode(html)),
						);

						const embed = toHtml(jsonCanvasEmbed({
							context,
							content,
						}));

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

								return toRelativePathString(file.path, item.path);
							},
						);

						await macanaReplaceDocumentToken(
							item.content.content,
							async (token) => {
								const { document, fragments } = tree.exchangeToken(token);

								const hash = fragments.length > 0
									? "#" + document.content.getHash(fragments)
									: "";

								return {
									path:
										toRelativePathString([...document.path, ""], item.path) +
										hash,
								};
							},
						);

						const hast = fromMdast(item.content.content);
						const toc = tocMut(hast);

						const html = toHtml(markdownPage({
							context,
							content: styleMarkdownContent(hast),
							tocItems: toc,
						}));

						writeTasks.push(
							fileSystemWriter.write([
								...basePath,
								"index.html",
							], enc.encode(html)),
						);

						const embed = toHtml(markdownEmbed({
							context,
							content: styleMarkdownContent(hast),
						}));

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
