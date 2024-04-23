// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */
/** @jsxFrag Fragment */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";
import type * as Hast from "../../../../deps/esm.sh/hast/types.ts";
import * as jsxRuntime from "../../../../deps/deno.land/x/nano_jsx/jsx-runtime/index.ts";
import { toJsxRuntime } from "../../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";
import * as HastToJSXRuntime from "../../../../deps/esm.sh/hast-util-to-jsx-runtime/mod.ts";

import { css } from "../../css.ts";
import {
	type CalloutType,
} from "../../../../content_parser/obsidian_markdown.ts";

import * as LucideIcons from "../lucide_icons.tsx";

export const styles = css``;

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

export interface ViewProps {
	node: Hast.Nodes;
}

export function View({ node }: ViewProps) {
	return render(node);
}
