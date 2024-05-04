// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/esm.sh/hastscript/mod.ts";
import type * as Hast from "../../../deps/esm.sh/hast/types.ts";

import type { JSONCanvas } from "../../../content_parser/json_canvas/types.ts";

import type { BuildContext } from "../context.ts";
import { buildClasses, css, join } from "../css.ts";

import { layout, layoutStyles } from "../widgets/layout.tsx";
import {
	documentTree,
	documentTreeScript,
	documentTreeStyles,
} from "../widgets/document_tree.tsx";
import { footer, footerStyles } from "../widgets/footer.tsx";
import { pageMetadata, pageMetadataScript } from "../widgets/page_metadata.tsx";
import { jsonCanvas, jsonCanvasStyles } from "../json_canvas/mod.tsx";

import { embedTemplate, template } from "./template.tsx";

const c = buildClasses("p-jc", [
	"meta",
	"title",
	"canvas",
	"svg",
]);

const ownStyles = css`
	.${c.meta} {
		position: absolute;
		left: 8px;
		top: 8px;
		padding: 4px;
		border: 1px solid var(--color-border);

		border-radius: 2px;
		background-color: var(--color-bg-accent);
		z-index: 2;
	}

	.${c.title} {
		margin: 0;
		font-weight: normal;
		font-size: 1rem;
		line-height: 1.5;
	}

	.${c.canvas} {
		position: absolute;
		inset: 0;

		overflow: auto;
		z-index: 1;
	}

	.${c.svg} {
		padding: 8rem;
		overflow: visible;
	}
`;

export const jsonCanvasPageStyles = join(
	layoutStyles,
	documentTreeStyles,
	footerStyles,
	jsonCanvasStyles,
	ownStyles,
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
			scripts: [pageMetadataScript, documentTreeScript],
			body: layout({
				fullscreen: true,
				nav: documentTree({ context }),
				footer: footer({ copyright: context.copyright }),
				main: (
					<div>
						<div class={c.meta}>
							<h1 class={c.title}>{context.document.metadata.title}</h1>
							{pageMetadata({ context })}
						</div>
						<div class={c.canvas}>
							{jsonCanvas({ className: c.svg, data: content })}
						</div>
					</div>
				),
				context,
			}),
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
