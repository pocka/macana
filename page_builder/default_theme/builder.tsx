// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h, renderSSR } from "../../deps/deno.land/x/nano_jsx/mod.ts";
import { fromMarkdown } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";

import type {
	Document,
	DocumentDirectory,
	DocumentTree,
} from "../../tree_builder/interface.ts";
import type { BuildParameters, PageBuilder } from "../interface.ts";

import * as css from "./css.ts";

import * as Html from "./components/html.tsx";

import { PathResolverProvider } from "./contexts/path_resolver.tsx";

interface InnerBuildParameters {
	item: DocumentDirectory | Document;

	tree: DocumentTree;

	parentLanguage: string;

	pathPrefix?: readonly string[];

	buildParameters: Omit<BuildParameters, "documentTree">;
}

export class DefaultThemeBuilder implements PageBuilder {
	#copyright: string;

	constructor(copyright: string) {
		this.#copyright = copyright;
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
			const content = await item.file.read();

			if (item.file.name.endsWith(".md")) {
				const html = "<!DOCTYPE html>" + renderSSR(
					() => (
						// Adds 1 to depth due to	`<name>/index.html` conversion.
						<PathResolverProvider depth={pathPrefix.length + 1}>
							<Html.View
								tree={tree}
								content={fromMarkdown(content)}
								document={item}
								language={item.metadata.language || parentLanguage}
								copyright={this.#copyright}
							/>
						</PathResolverProvider>
					),
				);

				const enc = new TextEncoder();

				await fileSystemWriter.write([
					...pathPrefix,
					item.file.name.replace(/\.md$/, ""),
					"index.html",
				], enc.encode(html));
				return;
			}

			if (item.file.name.endsWith(".canvas")) {
				// TODO: Proper logging
				console.warn(
					"Default theme page builder does not support Canvas yet.",
				);
				return;
			}

			return;
		}

		await Promise.all(item.entries.map((entry) =>
			this.#build({
				item: entry,
				tree,
				parentLanguage: item.metadata.language || parentLanguage,
				pathPrefix: [...pathPrefix, item.directory.name],
				buildParameters,
			})
		));
	}
}
