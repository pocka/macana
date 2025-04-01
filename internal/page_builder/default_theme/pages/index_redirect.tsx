// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/npm/hastscript/mod.ts";

export interface IndexRedirectProps {
	redirectTo: string;
}

export function indexRedirect({ redirectTo }: IndexRedirectProps) {
	return h(null, [
		{ type: "doctype" },
		<html>
			<head>
				<meta charset="utf-8" />
				<meta http-equiv="refresh" content={`0; URL='${redirectTo}'`} />
			</head>
			<body>
				{/* For cases when a user or UA disallows automatic redirection. */}
				<a href={redirectTo}>TOP</a>
			</body>
		</html>,
	]);
}
