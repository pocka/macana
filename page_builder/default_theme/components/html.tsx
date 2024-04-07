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
import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";
import { toHast } from "../../../deps/esm.sh/mdast-util-to-hast/mod.ts";
import { toJsxRuntime } from "../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";

import type {
	Document,
	DocumentTree,
} from "../../../tree_builder/interface.ts";

import { usePathResolver } from "../contexts/path_resolver.tsx";
import * as css from "../css.ts";

import { globalStyles } from "./global_styles.ts";
import { mapTocItem, tocMut } from "../hast/hast_util_toc_mut.ts";

import * as DocumentTreeUI from "./organisms/document_tree.tsx";
import * as Footer from "./organisms/footer.tsx";
import * as Toc from "./organisms/toc.tsx";
import * as SiteLayout from "./templates/site_layout.tsx";

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
);

export interface ViewProps {
	document: Document;

	/**
	 * Root document tree, for navigations and links.
	 */
	tree: DocumentTree;

	/**
	 * The document's content HTML.
	 */
	content: Mdast.Root;

	language: string;

	copyright: string;
}

export function View(
	{ document, language, content, tree, copyright }: ViewProps,
) {
	const path = usePathResolver();

	const hast = toHast(content);

	const toc = tocMut(hast).map((item) =>
		mapTocItem(item, (item) => toNode({ type: "root", children: item }))
	);

	const contentNodes = toNode(hast);

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
				<SiteLayout.View
					aside={toc.length > 0 && <Toc.View toc={toc} />}
					nav={
						<DocumentTreeUI.View
							tree={tree}
							currentPath={document.file.path}
						/>
					}
					footer={<Footer.View copyright={copyright} />}
				>
					<h1>{document.metadata.title}</h1>
					{contentNodes}
				</SiteLayout.View>
			</body>
		</html>
	);
}
