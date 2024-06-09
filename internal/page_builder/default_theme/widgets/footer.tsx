// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/esm.sh/hastscript/mod.ts";

import { buildClasses, css } from "../css.ts";
import { type BuildContext } from "../context.ts";

const c = buildClasses("w-fo", [
	"root",
	"copyright",
	null,
	"thirdPartyNotices",
]);

export const footerStyles = css`
	.${c.root} {
		display: flex;
		flex-direction: column;
		justify-content: start;
		align-items: end;
		gap: 4px;
		font-size: 0.8rem;
	}

	.${c.copyright} {
		font-size: 1em;
	}

	.${c.thirdPartyNotices} {
		color: var(--color-fg-sub);
		text-decoration: underline;
	}
`;

export interface FooterProps {
	context: BuildContext;
}

export function footer({ context }: FooterProps) {
	return (
		<div class={c.root}>
			<small class={c.copyright}>{context.copyright}</small>
			<a
				class={c.thirdPartyNotices}
				href={context.resolveURL(context.assets.thirdPartyNotices)}
			>
				Third party notices
			</a>
		</div>
	);
}
