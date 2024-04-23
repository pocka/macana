// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h } from "../../../deps/deno.land/x/nano_jsx/mod.ts";
import type * as Hast from "../../../deps/esm.sh/hast/types.ts";

import type {
	Document,
	DocumentMetadata,
	DocumentTree,
} from "../../../types.ts";
import type { JSONCanvas } from "../../../content_parser/json_canvas/types.ts";

import { usePathResolver } from "../contexts/path_resolver.tsx";
import * as css from "../css.ts";

import { globalStyles } from "./global_styles.ts";
import { TocItem } from "../hast/hast_util_toc_mut.ts";
import type { Assets } from "../builder.tsx";

import * as LucideIcons from "./lucide_icons.tsx";

import * as HastRenderer from "./atoms/hast_renderer.tsx";
import * as JSONCanvasRenderer from "./atoms/json_canvas_renderer.tsx";
import * as DocumentTreeUI from "./organisms/document_tree.tsx";
import * as Footer from "./organisms/footer.tsx";
import * as Toc from "./organisms/toc.tsx";
import * as SiteLayout from "./templates/site_layout.tsx";

export const styles = css.join(
	globalStyles,
	LucideIcons.styles,
	DocumentTreeUI.styles,
	Footer.styles,
	SiteLayout.styles,
	Toc.styles,
	JSONCanvasRenderer.styles,
	HastRenderer.styles,
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

interface ViewProps {
	document: Document;

	language: string;

	assets: Assets;

	children: JSX.ElementChildrenAttribute["children"];
}

function View(
	{ assets, language, document, children }: ViewProps,
) {
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
				{children}
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

export interface ObsidianMarkdownViewProps extends Omit<ViewProps, "children"> {
	tree: DocumentTree;

	copyright: string;

	// nano-jsx does not ship any usable type definition
	content: unknown;

	// nano-jsx does not ship any usable type definition
	toc: readonly TocItem<unknown>[];
}

export function ObsidianMarkdownView(
	{ copyright, tree, content, toc, ...props }: ObsidianMarkdownViewProps,
) {
	const { document, assets } = props;

	return (
		<View {...props}>
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
				{content}
			</SiteLayout.View>
		</View>
	);
}

export interface JSONCanvasViewProps extends Omit<ViewProps, "children"> {
	tree: DocumentTree;

	copyright: string;

	// nano-jsx does not ship usable type definition
	content: JSONCanvas<unknown>;
}

export function JSONCanvasView(
	{ tree, copyright, content, ...props }: JSONCanvasViewProps,
) {
	const { document, assets } = props;

	return (
		<View {...props}>
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
				<JSONCanvasRenderer.View data={content} />
			</SiteLayout.View>
		</View>
	);
}

interface BaseEmbedProps {
	document: Document;

	language: string;

	assets: Assets;

	children: JSX.ElementChildrenAttribute["children"];
}

function BaseEmbed({ document, language, assets, children }: BaseEmbedProps) {
	const path = usePathResolver();

	return (
		<html lang={language}>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="robot" content="noindex" />
				<title>{document.metadata.title}</title>
				<link
					rel="stylesheet"
					href={path.resolve(assets.globalCss)}
				/>
			</head>
			<body>
				{children}
			</body>
		</html>
	);
}

export interface ObsidianMarkdownEmbedProps
	extends Omit<BaseEmbedProps, "children"> {
	content: Hast.Nodes;
}

export function ObsidianMarkdownEmbed(
	{ content, ...rest }: ObsidianMarkdownEmbedProps,
) {
	return (
		<BaseEmbed {...rest}>
			<HastRenderer.View node={content} />
		</BaseEmbed>
	);
}

export interface JSONCanvasEmbedProps extends Omit<BaseEmbedProps, "children"> {
	// nano-jsx does not ship usable TypeScript definition.
	content: JSONCanvas<unknown>;
}

export function JSONCanvasEmbed({ content, ...rest }: JSONCanvasEmbedProps) {
	return (
		<BaseEmbed {...rest}>
			<JSONCanvasRenderer.View data={content} />
		</BaseEmbed>
	);
}
