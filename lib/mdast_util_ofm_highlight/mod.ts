// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { Extension } from "../../deps/esm.sh/mdast-util-from-markdown/mod.ts";

export function ofmHighlightFromMarkdown(): Extension {
	return {
		enter: {
			ofmHighlight(token) {
				this.enter({
					// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
					//                   which Deno does not support. APIs also don't accept type parameters.
					type: "ofmHighlight",
					children: [],
					data: {
						hName: "mark",
					},
				}, token);
			},
		},
		exit: {
			ofmHighlight(token) {
				this.exit(token);
			},
		},
	};
}
