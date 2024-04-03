// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Hast from "../../../deps/esm.sh/hast/types.ts";
import { SKIP, visit } from "../../../deps/esm.sh/unist-util-visit/mod.ts";
import { fastUslug } from "../../../deps/esm.sh/@shelf/fast-uslug/mod.ts";
import { isElement } from "../../../deps/esm.sh/hast-util-is-element/mod.ts";
import { toString } from "../../../deps/esm.sh/hast-util-to-string/mod.ts";

export interface TocItem<Node = Hast.ElementContent[]> {
	id: string;
	text: Node;
	level: number;

	children: TocItem<Node>[];
}

export function mapTocItem<A, B>(item: TocItem<A>, f: (a: A) => B): TocItem<B> {
	return {
		id: item.id,
		level: item.level,
		text: f(item.text),
		children: item.children.map((child) => mapTocItem(child, f)),
	};
}

function getParent(level: number, items: readonly TocItem[]): TocItem | null {
	if (!items.length) {
		return null;
	}

	const [head] = items;
	if (head.level >= level) {
		return null;
	}

	if (head.level === level + 1) {
		return items[items.length - 1];
	}

	return getParent(level, items[items.length - 1].children);
}

/**
 * Mutates given Hast by adding ID to headings and Returns table of contents.
 */
export function tocMut<Node extends Hast.Node>(
	hast: Node,
): readonly TocItem<Hast.ElementContent[]>[] {
	const items: TocItem[] = [];

	visit(hast, (node) => {
		if (!isElement(node)) {
			return false;
		}

		switch (node.tagName) {
			case "h1":
			case "h2":
			case "h3":
			case "h4":
			case "h5":
			case "h6":
				return true;
			default:
				return false;
		}
	}, (node) => {
		if (!isElement(node)) {
			return SKIP;
		}

		const levelMatch = node.tagName.match(/^h(\d)$/);
		if (!levelMatch) {
			return SKIP;
		}

		const level = parseInt(levelMatch[1]);
		if (!Number.isFinite(level)) {
			return SKIP;
		}

		let id = node.properties.id;
		if (typeof id !== "string") {
			id = fastUslug(toString(node), {
				lower: false,
			});
			node.properties.id = id;
		}

		const parent = getParent(level, items)?.children || items;
		parent.push({
			id,
			level,
			text: node.children,
			children: [],
		});
	});

	return items;
}
