// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/esm.sh/hastscript/mod.ts";
import type * as Hast from "../../../deps/esm.sh/hast/types.ts";

import type { JSONCanvas } from "../../../content_parser/json_canvas/types.ts";

import type { BuildContext } from "../context.ts";
import * as css from "../css.ts";

import { layout, layoutStyles } from "../widgets/layout.tsx";
import { documentTree, documentTreeStyles } from "../widgets/document_tree.tsx";
import { footer, footerStyles } from "../widgets/footer.tsx";
import { title, titleStyles } from "../widgets/title.tsx";
import { pageMetadata, pageMetadataScript } from "../widgets/page_metadata.tsx";
import {
	jsonCanvas,
	jsonCanvasStyles,
	wrappedJsonCanvas,
} from "../json_canvas/mod.tsx";

import { embedTemplate, template } from "./template.tsx";

export const jsonCanvasPageStyles = css.join(
	layoutStyles,
	documentTreeStyles,
	footerStyles,
	titleStyles,
	jsonCanvasStyles,
);

export interface JsonCanvasPageProps {
	context: Readonly<BuildContext>;

	content: JSONCanvas<Hast.Nodes>;
}

export function jsonCanvasPage({ content, context }: JsonCanvasPageProps) {
	return h(null, [
		{ type: "doctype" },
		template({
			context,
			scripts: [pageMetadataScript],
			body: layout({
				nav: documentTree({ context }),
				footer: footer({ copyright: context.copyright }),
				main: h(null, [
					title({ children: context.document.metadata.title }),
					pageMetadata({ metadata: context.document.metadata }),
					wrappedJsonCanvas({ data: content }),
				]),
			}, context),
		}),
	]);
}

export function jsonCanvasEmbed({ context, content }: JsonCanvasPageProps) {
	return h(null, [
		{ type: "doctype" },
		embedTemplate({
			context,
			body: jsonCanvas({ data: content }),
		}),
	]);
}
