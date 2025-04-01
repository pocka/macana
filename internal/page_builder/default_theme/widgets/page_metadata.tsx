// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/npm/hastscript/mod.ts";

import type { DocumentBuildContext } from "../context.ts";

import { datetime, datetimeScript } from "./datetime.tsx";

export const pageMetadataScript = datetimeScript;

export interface PageMetadataProps {
	context: DocumentBuildContext;
}

export function pageMetadata(
	{ context: { document: { metadata }, language } }: PageMetadataProps,
) {
	if (!metadata.createdAt && !metadata.updatedAt) {
		return null;
	}

	return h(null, [
		metadata.createdAt
			? (
				<div>
					<small>
						Created at{" "}
						{datetime({ datetime: metadata.createdAt, langOrLocale: language })}
					</small>
				</div>
			)
			: null,
		metadata.updatedAt
			? (
				<div>
					<small>
						Updated at{" "}
						{datetime({ datetime: metadata.updatedAt, langOrLocale: language })}
					</small>
				</div>
			)
			: null,
	]);
}
