// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/npm/hastscript/mod.ts";

export const datetimeScript = `
document.querySelectorAll("[data-macana-datetime]").forEach(el => {
	const datetime = new Date(el.dataset.macanaDatetime);
	el.textContent = datetime.toLocaleString(document.documentElement.lang, {
		dateStyle: "medium",
		timeStyle: "short",
	});
	el.style.display = "";
});
`.trim();

export interface DatetimeProps {
	datetime: Date;

	langOrLocale?: string;
}

export function datetime({ datetime, langOrLocale }: DatetimeProps) {
	const z = datetime.toISOString();

	return h(null, [
		<noscript>
			<time datetime={z}>
				{datetime.toLocaleString(langOrLocale, {
					year: "numeric",
					month: "numeric",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					timeZone: "UTC",
					timeZoneName: "short",
				})}
			</time>
		</noscript>,
		// Initially hidden in order to avoid duplication on noscript env
		<time style="display:none;" datetime={z} data-macana-datetime={z} />,
	]);
}
