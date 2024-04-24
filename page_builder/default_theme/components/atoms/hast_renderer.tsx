// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */
/** @jsxFrag Fragment */

import type * as Hast from "../../../../deps/esm.sh/hast/types.ts";
import * as jsxRuntime from "../../../../deps/deno.land/x/nano_jsx/jsx-runtime/index.ts";
import { toJsxRuntime } from "../../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";
import * as HastToJSXRuntime from "../../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";

import { join as joinCss } from "../../css.ts";
import * as callout from "../from-hast/callout.tsx";

export const styles = joinCss(callout.styles);

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

export function render(hast: Hast.Nodes) {
	return toJsxRuntime(hast, {
		components: {
			"macana-ofm-callout": callout.MacanaOfmCallout,
			"macana-ofm-callout-title": callout.MacanaOfmCalloutTitle,
			"macana-ofm-callout-body": callout.MacanaOfmCalloutBody,
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

export interface ViewProps {
	node: Hast.Nodes;
}

export function View({ node }: ViewProps) {
	return render(node);
}
