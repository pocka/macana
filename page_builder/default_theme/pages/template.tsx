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
	const { language, document, websiteTitle, assets, resolvePath } = context;

	return (
		<html lang={language}>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{document.metadata.title} - {websiteTitle}</title>
				<link
					rel="stylesheet"
					href={resolvePath(assets.globalCss).join("/")}
				/>
				{assets.faviconSvg && (
					<link
						rel="icon"
						type="image/svg+xml"
						href={resolvePath(assets.faviconSvg).join("/")}
					/>
				)}
				{assets.faviconPng && (
					<link
						rel="icon"
						type="image/png"
						href={resolvePath(assets.faviconPng).join("/")}
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
