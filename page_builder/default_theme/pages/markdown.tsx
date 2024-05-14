// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/esm.sh/hastscript/mod.ts";
import type * as Hast from "../../../deps/esm.sh/hast/types.ts";

import type { BuildContext } from "../context.ts";
import { buildClasses, css, join } from "../css.ts";
import type { TocItem } from "../hast/hast_util_toc_mut.ts";

import { layout, layoutScript, layoutStyles } from "../widgets/layout.tsx";
import { toc, tocStyles } from "../widgets/toc.tsx";
import {
	documentTree,
	documentTreeScript,
	documentTreeStyles,
} from "../widgets/document_tree.tsx";
import { footer, footerStyles } from "../widgets/footer.tsx";
import { title, titleStyles } from "../widgets/title.tsx";
import { pageMetadata, pageMetadataScript } from "../widgets/page_metadata.tsx";

import { template } from "./template.tsx";

const c = buildClasses("p-md", [
	"main",
	"toc",
	"tocInner",
]);

const ownStyles = css`
	.${c.main} {
		max-width: 50rem;
		padding: calc(var(--baseline) * 1rem) 1rem;
		margin: 0 auto;
	}

	@media (min-width: 110rem) {
		.${c.main} {
			max-width: 100%;
			display: grid;
			grid-template-columns: 50rem minmax(0, 1fr);
			grid-template-rows: min-content max-content;
			column-gap: 2rem;

			margin: 0;
			padding-inline-start: 64px;
		}

		.${c.main} > * {
			grid-column: 1;
		}

		.${c.toc} {
			grid-column: 2;
			grid-row: 1 / -1;
		}

		.${c.tocInner} {
			position: sticky;
			top: calc(var(--baseline) * 1rem);
		}
	}
`;

export const markdownPageStyles = join(
	layoutStyles,
	tocStyles,
	documentTreeStyles,
	footerStyles,
	titleStyles,
	ownStyles,
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
			scripts: [pageMetadataScript, layoutScript, documentTreeScript],
			body: layout({
				nav: documentTree({ context }),
				footer: footer({ copyright: context.copyright }),
				main: (
					<div class={c.main}>
						<div>
							{title({ children: context.document.metadata.title })}
							{pageMetadata({ context })}
						</div>
						{tocItems.length > 0
							? (
								<div class={c.toc}>
									{toc({ className: c.tocInner, toc: tocItems })}
								</div>
							)
							: undefined}
						{content}
					</div>
				),
				context,
			}),
		}),
	]);
}
