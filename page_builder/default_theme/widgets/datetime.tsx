// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/esm.sh/hastscript/mod.ts";

export const datetimeScript = `
document.querySelectorAll("[data-macana-datetime]").forEach(el => {
	const datetime = new Date(el.dataset.macanaDatetime);
	el.textContent = datetime.toLocaleString();
	el.style.display = "";
});
`.trim();

export interface DatetimeProps {
	datetime: Date;
}

export function datetime({ datetime }: DatetimeProps) {
	const z = datetime.toISOString();

	return h(null, [
		<noscript>
			<time datetime={z}>{z}</time>
		</noscript>,
		// Initially hidden in order to avoid duplication on noscript env
		<time style="display:none;" datetime={z} data-macana-datetime={z} />,
	]);
}
