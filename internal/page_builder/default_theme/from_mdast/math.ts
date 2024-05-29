// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Hast from "../../../../deps/esm.sh/hast/types.ts";
import type * as Mdast from "../../../../deps/esm.sh/mdast/types.ts";
import { type Raw } from "../../../../deps/esm.sh/mdast-util-to-hast/mod.ts";
import {
	type InlineMath,
	type Math,
} from "../../../../deps/esm.sh/mdast-util-math/mod.ts";
import temml from "../../../../deps/esm.sh/temml/mod.ts";

import {
	type Handlers,
	type State,
} from "../../../../deps/esm.sh/mdast-util-to-hast/mod.ts";

export function mathHandlers(): Handlers {
	return {
		// @ts-expect-error: unist-related libraries heavily relies on ambient module declarations,
		//                   which Deno does not support. APIs also don't accept type parameters.
		math(_state: State, node: Math & Mdast.Literal): Raw & Hast.Literal {
			return {
				type: "raw",
				value: temml.renderToString(node.value),
			};
		},
		inlineMath(
			_state: State,
			node: InlineMath & Mdast.Literal,
		): Raw & Hast.Literal {
			return {
				type: "raw",
				value: temml.renderToString(node.value),
			};
		},
	};
}
