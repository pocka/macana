// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/esm.sh/hastscript/mod.ts";
import type * as Hast from "../../../deps/esm.sh/hast/types.ts";

import type { BuildContext } from "../context.ts";
import * as css from "../css.ts";
import type { TocItem } from "../hast/hast_util_toc_mut.ts";

import { layout, layoutStyles } from "../widgets/layout.tsx";
import { toc, tocStyles } from "../widgets/toc.tsx";
import { documentTree, documentTreeStyles } from "../widgets/document_tree.tsx";
import { footer, footerStyles } from "../widgets/footer.tsx";
import { title, titleStyles } from "../widgets/title.tsx";
import { pageMetadata, pageMetadataScript } from "../widgets/page_metadata.tsx";

import { embedTemplate, template } from "./template.tsx";

export const markdownPageStyles = css.join(
	layoutStyles,
	tocStyles,
	documentTreeStyles,
	footerStyles,
	titleStyles,
);

export interface MarkdownPageProps {
	context: Readonly<BuildContext>;

	content: Hast.Nodes;

	tocItems: readonly TocItem[];
}

export function markdownPage(
	{ context, content, tocItems }: MarkdownPageProps,
) {
	return h(null, [
		{ type: "doctype" },
		template({
			context,
			scripts: [pageMetadataScript],
			body: layout({
				aside: tocItems.length > 0 ? toc({ toc: tocItems }) : undefined,
				nav: documentTree({ context }),
				footer: footer({ copyright: context.copyright }),
				main: h(null, [
					title({ children: context.document.metadata.title }),
					pageMetadata({ metadata: context.document.metadata }),
					content,
				]),
			}, context),
		}),
	]);
}

export interface MarkdownEmbedProps {
	context: Readonly<BuildContext>;

	content: Hast.Nodes;
}

export function markdownEmbed({ context, content }: MarkdownEmbedProps) {
	return h(null, [
		{ type: "doctype" },
		embedTemplate({
			context,
			body: content,
		}),
	]);
}
