// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/deno.land/x/nano_jsx/mod.ts";
import {
	Fragment,
	jsx,
	jsxs,
} from "../../../deps/deno.land/x/nano_jsx/jsx-runtime/index.ts";
import { toHast } from "../../../deps/esm.sh/mdast-util-to-hast/mod.ts";
import { toJsxRuntime } from "../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";

import type {
	Document,
	DocumentTree,
} from "../../../tree_builder/interface.ts";
import type { ObsidianMarkdownDocument } from "../../../content_parser/obsidian_markdown.ts";
import type { JSONCanvasDocument } from "../../../content_parser/json_canvas.ts";

import { usePathResolver } from "../contexts/path_resolver.tsx";
import * as css from "../css.ts";

import { globalStyles } from "./global_styles.ts";
import { mapTocItem, tocMut } from "../hast/hast_util_toc_mut.ts";

import * as DocumentTreeUI from "./organisms/document_tree.tsx";
import * as Footer from "./organisms/footer.tsx";
import * as Toc from "./organisms/toc.tsx";
import * as SiteLayout from "./templates/site_layout.tsx";
import * as JSONCanvasRenderer from "./json_canvas_renderer.tsx";

function toNode(hast: ReturnType<typeof toHast>) {
	return toJsxRuntime(hast, {
		Fragment,
		// @ts-ignore: library type being unnecessary narrow
		jsx,
		// @ts-ignore: library type being unnecessary narrow
		jsxs,
	});
}

export const styles = css.join(
	globalStyles,
	DocumentTreeUI.styles,
	Footer.styles,
	SiteLayout.styles,
	Toc.styles,
	JSONCanvasRenderer.styles,
);

interface ObsidianMarkdownBodyProps extends ViewProps {
	content: ObsidianMarkdownDocument;
}

function ObsidianMarkdownBody(
	{ content, document, tree, copyright }: ObsidianMarkdownBodyProps,
) {
	const hast = toHast(content.content);

	const toc = tocMut(hast).map((item) =>
		mapTocItem(item, (item) => toNode({ type: "root", children: item }))
	);

	const contentNodes = toNode(hast);

	return (
		<SiteLayout.View
			aside={toc.length > 0 && <Toc.View toc={toc} />}
			nav={
				<DocumentTreeUI.View
					tree={tree}
					currentPath={document.path}
				/>
			}
			footer={<Footer.View copyright={copyright} />}
		>
			<h1>{document.metadata.title}</h1>
			{contentNodes}
		</SiteLayout.View>
	);
}

interface JSONCanvasBodyProps extends ViewProps {
	content: JSONCanvasDocument;
}

function JSONCanvasBody(
	{ content, document, copyright, tree }: JSONCanvasBodyProps,
) {
	return (
		<SiteLayout.View
			nav={
				<DocumentTreeUI.View
					tree={tree}
					currentPath={document.path}
				/>
			}
			footer={<Footer.View copyright={copyright} />}
		>
			<h1>{document.metadata.title}</h1>
			<JSONCanvasRenderer.View data={content.content} />
		</SiteLayout.View>
	);
}

export interface ViewProps {
	document: Document<ObsidianMarkdownDocument | JSONCanvasDocument>;

	/**
	 * Root document tree, for navigations and links.
	 */
	tree: DocumentTree;

	language: string;

	copyright: string;
}

export function View(
	props: ViewProps,
) {
	const { document, language } = props;

	const path = usePathResolver();

	return (
		<html lang={language}>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{document.metadata.title}</title>
				<link
					rel="stylesheet"
					href={path.resolve(["assets", "global.css"])}
				/>
			</head>
			<body>
				{document.content.kind === "json_canvas"
					? <JSONCanvasBody content={document.content} {...props} />
					: <ObsidianMarkdownBody content={document.content} {...props} />}
			</body>
		</html>
	);
}
