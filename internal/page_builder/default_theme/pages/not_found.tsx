// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/esm.sh/hastscript/mod.ts";

import type { BuildContext } from "../context.ts";
import { buildClasses, css, join } from "../css.ts";

import {
	documentTree,
	documentTreeScript,
	documentTreeStyles,
} from "../widgets/document_tree.tsx";
import { footer, footerStyles } from "../widgets/footer.tsx";
import { layout, layoutScript, layoutStyles } from "../widgets/layout.tsx";

import { template } from "./template.tsx";

const c = buildClasses("p-nf", [
	"container",
	"layout",
	"title",
	"topLink",
]);

const ownStyles = css`
	.${c.container} {
		margin-top: calc(var(--baseline) * 3rem);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.${c.layout} {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: start;
		gap: calc(var(--baseline) * 1rem);
	}

	.${c.title} {
		font-weight: bold;
		font-size: 2rem;
		line-height: calc(var(--baseline) * 2rem);
		margin: 0;
	}

	.${c.topLink} {
		font-weight: 500;

		color: var(--color-fg-sub);
		text-decoration: underline;

		transition: color 0.15s ease;
	}
	.${c.topLink}:hover {
		color: var(--color-primary);
	}
`;

export const notFoundPageStyles = join(
	layoutStyles,
	documentTreeStyles,
	footerStyles,
	ownStyles,
);

export interface NotFoundPageProps {
	context: Readonly<BuildContext>;
}

export function notFoundPage({ context }: NotFoundPageProps) {
	return h(null, [
		{ type: "doctype" },
		template({
			context,
			scripts: [layoutScript, documentTreeScript],
			body: layout({
				context,
				nav: documentTree({ context }),
				footer: footer({ copyright: context.copyright }),
				main: (
					<div class={c.container}>
						<div class={c.layout}>
							<h1 class={c.title}>404 - Not Found</h1>
							<a
								class={c.topLink}
								href={context.resolveURL([
									...context.documentTree.defaultDocument.path,
									"",
								])}
							>
								{context.documentTree.defaultDocument.metadata.title}
							</a>
						</div>
					</div>
				),
			}),
		}),
	]);
}
