// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { type Child, h } from "../../../../deps/esm.sh/hastscript/mod.ts";
import { Md5 } from "../../../../deps/deno.land/std/hash/md5.ts";

import type { BuildContext, DocumentBuildContext } from "../context.ts";

export interface TemplateProps {
	body: Child;

	context: Readonly<BuildContext | DocumentBuildContext>;

	scripts?: readonly string[];
}

export function template({ body, context, scripts = [] }: TemplateProps) {
	const { language, websiteTitle, assets, resolveURL } = context;
	const document = "document" in context ? context.document : null;

	const scriptHrefs = scripts.map((script) => {
		const binary = new TextEncoder().encode(script);

		const md5 = new Md5();

		md5.update(binary);

		const name = md5.toString("hex");
		const path = [".assets", `${name}.js`];

		context.writeFile(path, binary);

		return context.resolveURL(path);
	});

	return (
		<html lang={language}>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{document
					? <title>{document.metadata.title} - {websiteTitle}</title>
					: <title>{websiteTitle}</title>}
				{document?.metadata.description && (
					<meta name="description" content={document.metadata.description} />
				)}
				<link
					rel="stylesheet"
					href={resolveURL(assets.globalCss)}
				/>
				{assets.faviconSvg && (
					<link
						rel="icon"
						type="image/svg+xml"
						href={resolveURL(assets.faviconSvg)}
					/>
				)}
				{assets.faviconPng && (
					<link
						rel="icon"
						type="image/png"
						href={resolveURL(assets.faviconPng)}
					/>
				)}
				{document && assets.openGraphImage && (
					h(null, [
						<meta name="og:title" content={document.metadata.title} />,
						<meta name="og:type" content="article" />,
						<meta
							name="og:image"
							content={resolveURL(assets.openGraphImage)}
						/>,
						<meta name="og:url" content={resolveURL([...document.path, ""])} />,
						document.metadata.description && (
							<meta
								name="og:description"
								content={document.metadata.description}
							/>
						),
						document.metadata.createdAt && (
							<meta
								name="article:published_time"
								content={document.metadata.createdAt.toISOString()}
							/>
						),
						document.metadata.updatedAt && (
							<meta
								name="article:modified_time"
								content={document.metadata.updatedAt.toISOString()}
							/>
						),
					])
				)}
				{scriptHrefs.map((href) => <script src={href} type="module" defer />)}
			</head>
			{h(
				"body",
				{},
				body,
			)}
		</html>
	);
}
