// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h } from "../../../deps/deno.land/x/nano_jsx/mod.ts";
import * as jsxRuntime from "../../../deps/deno.land/x/nano_jsx/jsx-runtime/index.ts";
import { toHast } from "../../../deps/esm.sh/mdast-util-to-hast/mod.ts";
import type * as Mdast from "../../../deps/esm.sh/mdast/types.ts";
import { toJsxRuntime } from "../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";
import * as HastToJSXRuntime from "../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";

import type {
	Document,
	DocumentMetadata,
	DocumentTree,
} from "../../../types.ts";
import {
	type CalloutType,
	type ObsidianMarkdownDocument,
	ofmHtml,
	ofmToHastHandlers,
} from "../../../content_parser/obsidian_markdown.ts";
import type { JSONCanvasDocument } from "../../../content_parser/json_canvas.ts";
import * as jsonCanvas from "../../../content_parser/json_canvas/utils.ts";

import { usePathResolver } from "../contexts/path_resolver.tsx";
import * as css from "../css.ts";

import { globalStyles } from "./global_styles.ts";
import { mapTocItem, tocMut } from "../hast/hast_util_toc_mut.ts";
import { syntaxHighlightingHandlers } from "../mdast/syntax_highlighting_handlers.ts";
import type { Assets } from "../builder.tsx";

import * as LucideIcons from "./lucide_icons.tsx";

import * as JSONCanvasRenderer from "./atoms/json_canvas_renderer.tsx";
import * as DocumentTreeUI from "./organisms/document_tree.tsx";
import * as Footer from "./organisms/footer.tsx";
import * as Toc from "./organisms/toc.tsx";
import * as SiteLayout from "./templates/site_layout.tsx";

function nanoifyProps(props: HastToJSXRuntime.Props): HastToJSXRuntime.Props {
	const ret: HastToJSXRuntime.Props = {};

	for (const key in props) {
		switch (props[key]) {
			// nanojsx cannot handle falsy attribute correctly
			case false:
			case null:
				break;
			// ideal `true` for boolean attribute is empty string, but nanojsx emits `"true"`.
			case true:
				ret[key] = "";
				break;
			default:
				ret[key] = props[key];
				break;
		}
	}

	return ret;
}

function toNode(hast: ReturnType<typeof toHast>) {
	return toJsxRuntime(hast, {
		components: {
			MacanaOfmCalloutIcon({ type }: { type: CalloutType }) {
				switch (type) {
					case "abstract":
						return (
							<LucideIcons.ClipboardList
								role="img"
								aria-label="Clipboard icon"
							/>
						);
					case "info":
						return <LucideIcons.Info role="img" aria-label="Info icon" />;
					case "todo":
						return (
							<LucideIcons.CircleCheck role="img" aria-label="Check icon" />
						);
					case "tip":
						return <LucideIcons.Flame role="img" aria-label="Flame icon" />;
					case "success":
						return <LucideIcons.Check role="img" aria-label="Check icon" />;
					case "question":
						return (
							<LucideIcons.CircleHelp role="img" aria-label="Question icon" />
						);
					case "warning":
						return (
							<LucideIcons.TriangleAlert role="img" aria-label="Warning icon" />
						);
					case "failure":
						return <LucideIcons.X role="img" aria-label="Cross icon" />;
					case "danger":
						return <LucideIcons.Zap role="img" aria-label="Lightning icon" />;
					case "bug":
						return <LucideIcons.Bug role="img" aria-label="Bug icon" />;
					case "example":
						return <LucideIcons.List role="img" aria-label="List icon" />;
					case "quote":
						return <LucideIcons.Quote role="img" aria-label="Quote icon" />;
					case "note":
					default:
						return <LucideIcons.Pencil role="img" aria-label="Pencil icon" />;
				}
			},
		},
		Fragment: jsxRuntime.Fragment,
		jsx(type, props, key) {
			return jsxRuntime.jsx(type, nanoifyProps(props), key || "");
		},
		jsxs(type, props, key) {
			return jsxRuntime.jsxs(type, nanoifyProps(props), key || "");
		},
	});
}

export const styles = css.join(
	globalStyles,
	LucideIcons.styles,
	DocumentTreeUI.styles,
	Footer.styles,
	SiteLayout.styles,
	Toc.styles,
	JSONCanvasRenderer.styles,
);

interface DatetimeTextProps {
	datetime: Date;
}

function DatetimeText({ datetime }: DatetimeTextProps) {
	const z = datetime.toISOString();

	// Showing Z time for noscript env, because the timezone of the machine that build
	// this document and the timezone of viewers can be different.
	return (
		<>
			<noscript>
				<time datetime={z}>{z}</time>
			</noscript>
			{/* Initially hidden in order to avoid duplication on noscript env */}
			<time style="display:none;" datetime={z} data-macana-datetime={z} />
		</>
	);
}

interface MetadataDatesProps {
	metadata: DocumentMetadata;
}

function MetadataDates({ metadata }: MetadataDatesProps) {
	return (metadata.updatedAt || metadata.createdAt) && (
		<>
			{metadata.createdAt && (
				<div>
					<small>
						Created at <DatetimeText datetime={metadata.createdAt} />
					</small>
				</div>
			)}
			{metadata.updatedAt && (
				<div>
					<small>
						Updated at <DatetimeText datetime={metadata.updatedAt} />
					</small>
				</div>
			)}
		</>
	);
}

function mdastToHast(input: Mdast.Nodes) {
	return ofmHtml(toHast(input, {
		// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		handlers: {
			...ofmToHastHandlers({
				callout: {
					generateIcon(type) {
						return {
							type: "element",
							tagName: "MacanaOfmCalloutIcon",
							properties: {
								type,
							},
							children: [],
						};
					},
				},
			}),
			...syntaxHighlightingHandlers(),
		},
		allowDangerousHtml: true,
	}));
}

interface ObsidianMarkdownBodyProps extends ViewProps {
	content: ObsidianMarkdownDocument;
}

function ObsidianMarkdownBody(
	{ content, document, tree, copyright, assets }: ObsidianMarkdownBodyProps,
) {
	const hast = mdastToHast(content.content);

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
			logoImage={assets.siteLogo}
			defaultDocument={tree.defaultDocument}
		>
			<h1>{document.metadata.title}</h1>
			<MetadataDates metadata={document.metadata} />
			{contentNodes}
		</SiteLayout.View>
	);
}

interface JSONCanvasBodyProps extends ViewProps {
	content: JSONCanvasDocument<Mdast.Nodes>;
}

function JSONCanvasBody(
	{ content, document, copyright, tree, assets }: JSONCanvasBodyProps,
) {
	const canvas = jsonCanvas.mapTextSync(content.content, (node) => {
		return toNode(mdastToHast(node.text));
	});

	return (
		<SiteLayout.View
			nav={
				<DocumentTreeUI.View
					tree={tree}
					currentPath={document.path}
				/>
			}
			footer={<Footer.View copyright={copyright} />}
			logoImage={assets.siteLogo}
			defaultDocument={tree.defaultDocument}
		>
			<h1>{document.metadata.title}</h1>
			<MetadataDates metadata={document.metadata} />
			<JSONCanvasRenderer.View data={canvas} />
		</SiteLayout.View>
	);
}

export interface ViewProps {
	document: Document<
		ObsidianMarkdownDocument | JSONCanvasDocument<Mdast.Nodes>
	>;

	/**
	 * Root document tree, for navigations and links.
	 */
	tree: DocumentTree;

	language: string;

	copyright: string;

	assets: Assets;
}

export function View(
	{ assets, ...props }: ViewProps,
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
					href={path.resolve(assets.globalCss)}
				/>
				{assets.faviconSvg && (
					<link
						rel="icon"
						type="image/svg+xml"
						href={path.resolve(assets.faviconSvg)}
					/>
				)}
				{assets.faviconPng && (
					<link
						rel="icon"
						type="image/png"
						href={path.resolve(assets.faviconPng)}
					/>
				)}
			</head>
			<body>
				{document.content.kind === "json_canvas"
					? (
						<JSONCanvasBody
							content={document.content}
							assets={assets}
							{...props}
						/>
					)
					: (
						<ObsidianMarkdownBody
							content={document.content}
							assets={assets}
							{...props}
						/>
					)}
				<script>
					{`document.querySelectorAll("[data-macana-datetime]").forEach(el => {
	const datetime = new Date(el.dataset.macanaDatetime);
	el.textContent = datetime.toLocaleString();
	el.style.display = "";
});`}
				</script>
			</body>
		</html>
	);
}
