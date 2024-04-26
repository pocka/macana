// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/esm.sh/hastscript/mod.ts";

import type { DocumentMetadata } from "../../../types.ts";

import { datetime, datetimeScript } from "./datetime.tsx";

export const pageMetadataScript = datetimeScript;

export interface PageMetadataProps {
	metadata: DocumentMetadata;
}

export function pageMetadata({ metadata }: PageMetadataProps) {
	if (!metadata.createdAt && !metadata.updatedAt) {
		return null;
	}

	return h(null, [
		metadata.createdAt
			? (
				<div>
					<small>
						Created at {datetime({ datetime: metadata.createdAt })}
					</small>
				</div>
			)
			: null,
		metadata.updatedAt
			? (
				<div>
					<small>
						Updated at {datetime({ datetime: metadata.updatedAt })}
					</small>
				</div>
			)
			: null,
	]);
}
