// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Hast from "../../../../deps/npm/hast/types.ts";
import type * as Mdast from "../../../../deps/npm/mdast/types.ts";
import { type Raw } from "../../../../deps/npm/mdast-util-to-hast/mod.ts";
import {
	type InlineMath,
	type Math,
} from "../../../../deps/npm/mdast-util-math/mod.ts";
import temml from "../../../../deps/npm/temml/mod.ts";

import {
	type Handlers,
	type State,
} from "../../../../deps/npm/mdast-util-to-hast/mod.ts";

export function mathHandlers(): Handlers {
	return {
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
