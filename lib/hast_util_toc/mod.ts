// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type * as Hast from "../../deps/npm/hast/types.ts";
import { SKIP, visit } from "../../deps/npm/unist-util-visit/mod.ts";
import { fastUslug } from "../../deps/npm/@shelf/fast-uslug/mod.ts";
import { isElement } from "../../deps/npm/hast-util-is-element/mod.ts";
import { toString } from "../../deps/npm/hast-util-to-string/mod.ts";

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

/**
 * Mutates given Hast by adding ID to headings and Returns table of contents.
 */
export function tocMut<Node extends Hast.Node>(
	hast: Node,
): readonly TocItem<Hast.ElementContent[]>[] {
	const items: TocItem[] = [];
	const stack: TocItem[] = [];

	const counts = new Map<string, number>();

	const pop = () => {
		const popped = stack.pop();
		if (!popped) {
			return;
		}

		const parent = stack[stack.length - 1];
		if (!parent) {
			items.push(popped);
			return;
		}

		parent.children.push(popped);
	};

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

		const count = counts.get(id) ?? 0;

		counts.set(id, count + 1);

		if (count > 0) {
			id = id + "__" + count;
			node.properties.id = id;
		}

		const item: TocItem = {
			id,
			level,
			text: node.children,
			children: [],
		};

		if (!stack.length) {
			stack.push(item);
			return;
		}

		for (let i = stack.length; i >= 0; i--) {
			if (!stack[i]) {
				continue;
			}

			if (level < stack[i].level) {
				pop();
				continue;
			}

			if (level === stack[i].level) {
				pop();
				stack.push(item);
				break;
			}

			stack.push(item);
			break;
		}
	});

	while (stack.length > 0) {
		pop();
	}

	return items;
}
