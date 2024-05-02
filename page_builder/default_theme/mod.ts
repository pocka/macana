// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Hast from "../../deps/esm.sh/hast/types.ts";
import type * as Mdast from "../../deps/esm.sh/mdast/types.ts";
import { headingRange } from "../../deps/esm.sh/mdast-util-heading-range/mod.ts";
import { toHtml } from "../../deps/esm.sh/hast-util-to-html/mod.ts";

import { logger } from "../../logger.ts";

import type { BuildParameters, PageBuilder } from "../interface.ts";
import {
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
import { deleteId } from "./mdast/mdast_util_delete_id.ts";

import {
	fromMdast,
	fromMdastStyles,
	style as styleMarkdownContent,
} from "./from_mdast/mod.ts";
import {
	jsonCanvas as jsonCanvasRenderer,
	jsonCanvasStyles as jsonCanvasRendererStyles,
} from "./json_canvas/mod.tsx";
import { indexRedirect } from "./pages/index_redirect.tsx";
import { markdownPage, markdownPageStyles } from "./pages/markdown.tsx";
import { jsonCanvasPage, jsonCanvasPageStyles } from "./pages/json_canvas.tsx";

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
				jsonCanvasRendererStyles,
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

	#buildEmbed(
		context: BuildContext,
		target: Document,
		fragments: readonly string[] = [],
	): Hast.Nodes {
		if (isJSONCanvas(target)) {
			if (fragments.length > 0) {
				logger().warn(
					"JSONCanvas embeds does not support partial embed using hash",
					{
						embedder: context.document.path.join(" > "),
						target: target.path.join(" > "),
						fragments,
					},
				);
			}

			const content = jsonCanvas.mapNode(
				target.content.content,
				(node) => {
					switch (node.type) {
						case "text": {
							const nodes = structuredClone(node.text);

							deleteId(nodes);

							return {
								...node,
								text: fromMdast(nodes, {
									context,
									buildDocumentContent: (document, fragments) => {
										return this.#buildEmbed(
											context,
											document,
											fragments,
										);
									},
								}),
							};
						}
						case "file": {
							if (isAssetToken(node.file)) {
								const file = context.documentTree.exchangeToken(node.file);

								context.copyFile(file);

								return {
									...node,
									file: toRelativePathString(file.path, context.document.path),
								};
							}

							if (isDocumentToken(node.file)) {
								const { document, fragments } = context.documentTree
									.exchangeToken(
										node.file,
									);

								return {
									...node,
									type: "text",
									text: this.#buildEmbed(
										context,
										document,
										fragments,
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

			return jsonCanvasRenderer({
				data: content,
			});
		}

		if (isObsidianMarkdown(target)) {
			let nodes: Mdast.Nodes = structuredClone(target.content.content);

			if (fragments.length > 0) {
				const id = target.content.getHash(fragments);

				headingRange(
					nodes as Mdast.Root,
					id,
					(start, content) => {
						nodes = {
							type: "root",
							children: [
								start,
								...content,
							],
						};
					},
				);
			}

			deleteId(nodes);

			return fromMdast(nodes, {
				context,
				buildDocumentContent: (document, fragments) => {
					return this.#buildEmbed(context, document, fragments);
				},
			});
		}

		throw new Error(
			`Can't embed document "${
				target.path.join("/")
			}": unknown content kind (${target.content.kind})`,
		);
	}

	async #build(
		{ item, tree, parentLanguage, pathPrefix = [], buildParameters, assets }:
			InnerBuildParameters,
	): Promise<void> {
		const { fileSystemWriter } = buildParameters;

		if ("file" in item) {
			const writeTasks: Promise<unknown>[] = [];

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
				copyFile(file) {
					writeTasks.push(
						file.read().then((bytes) => {
							fileSystemWriter.write(file.path, bytes);
						}),
					);
				},
			};

			if (isObsidianMarkdown(item) || isJSONCanvas(item)) {
				const enc = new TextEncoder();

				const basePath = [
					...pathPrefix,
					item.metadata.name,
				];

				switch (item.content.kind) {
					case "json_canvas": {
						const content = jsonCanvas.mapNode(
							item.content.content,
							(node) => {
								switch (node.type) {
									case "text": {
										return {
											...node,
											text: fromMdast(node.text, {
												context,
												buildDocumentContent: (document, fragments) => {
													return this.#buildEmbed(
														context,
														document,
														fragments,
													);
												},
											}),
										};
									}
									case "file": {
										if (isAssetToken(node.file)) {
											const file = tree.exchangeToken(node.file);

											writeTasks.push(
												file.read().then((bytes) =>
													fileSystemWriter.write(file.path, bytes)
												),
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

											return {
												...node,
												type: "text",
												text: this.#buildEmbed(context, document, fragments),
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

						await Promise.all(writeTasks);
						return;
					}
					case "obsidian_markdown": {
						const hast = fromMdast(item.content.content, {
							context,
							buildDocumentContent: (document, fragments) => {
								return this.#buildEmbed(
									context,
									document,
									fragments,
								);
							},
						});
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
