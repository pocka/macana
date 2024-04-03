// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type { FileSystemWriter } from "./interface.ts";

const enum NodeType {
	File,
	Directory,
}

function nodeTypeToString(nodeType: NodeType): string {
	switch (nodeType) {
		case NodeType.File:
			return "file";
		case NodeType.Directory:
			return "directory";
	}
}

const SEP = "/";

/**
 * Wraps the given FileSystem Writer and returns a new FileSystem Writer
 * that checks tree structure so there won't be a directory and a file
 * having same name.
 */
export function validateTree(childWriter: FileSystemWriter): FileSystemWriter {
	const nodes = new Map<string, NodeType>();

	return {
		write(path, content) {
			setNodeTypeRecur(path, NodeType.File, nodes);

			return childWriter.write(path, content);
		},
	};
}

function setNodeTypeRecur(
	path: readonly string[],
	nodeType: NodeType,
	map: Map<string, NodeType>,
): void {
	if (path.length === 0) {
		return;
	}

	const key = path.join(SEP);

	const found = map.get(key);
	if (typeof found !== "undefined" && found !== nodeType) {
		const ns = nodeTypeToString(nodeType);
		const fs = nodeTypeToString(found);

		throw new Error(
			`Attempt to write a ${ns} at "${key}", but there already is a ${fs}.`,
		);
	}

	map.set(key, nodeType);

	return setNodeTypeRecur(path.slice(0, -1), NodeType.Directory, map);
}
