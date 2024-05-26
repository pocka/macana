// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { type Child, h } from "../../../deps/esm.sh/hastscript/mod.ts";

import type { BuildContext } from "../context.ts";

export interface TemplateProps {
	body: Child;

	context: Readonly<BuildContext>;

	scripts?: readonly string[];
}

export function template({ body, context, scripts = [] }: TemplateProps) {
	const { language, document, websiteTitle, assets, resolveURL } = context;

	return (
		<html lang={language}>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{document.metadata.title} - {websiteTitle}</title>
				{document.metadata.description && (
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
			</head>
			{h(
				"body",
				{},
				body,
				...scripts.map((script) => <script>{script}</script>),
			)}
		</html>
	);
}
