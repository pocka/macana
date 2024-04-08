// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// This file is a TypeScript type definition and validation function for the JSONCanvas 1.0.
// <https://jsoncanvas.org/spec/1.0/>

export type Red = "1";
export type Orange = "2";
export type Yellow = "3";
export type Green = "4";
export type Cyan = "5";
export type Purple = "6";

// TypeScript can't handle strict representation due to union limit, but
// that does not benefit so much. Also, the JSONCanvas "spec" does not define
// what hex format is (alpha? shorthand? uppercase?), so this is okay.
type HexColorFormat = `#${string}`;

const HEX_COLOR_FORMAT_REGEXP_PATTERN = /^#[a-z0-9]{3}([a-z0-9]{3})?$/i;

export function isHexColorFormat(x: unknown): x is HexColorFormat {
	if (typeof x !== "string") {
		return false;
	}

	return HEX_COLOR_FORMAT_REGEXP_PATTERN.test(x);
}

export type CanvasColor =
	| Red
	| Orange
	| Yellow
	| Green
	| Cyan
	| Purple
	| HexColorFormat;

export function isCanvasColor(x: unknown): x is CanvasColor {
	switch (x) {
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
		case "6":
			return true;
		default:
			return isHexColorFormat(x);
	}
}

export interface GenericNode {
	/**
	 * A unique ID for the node.
	 * NOTE: Length range and available characters are not defined in the spec.
	 */
	id: string;

	/**
	 * The node type.
	 */
	type: string;

	/**
	 * The x position of the node in pixels.
	 * NOTE: The spec does not define value range. Safe to use largest signed interger.
	 * NOTE: This type currently does not care bigint ranges.
	 */
	x: number;

	/**
	 * The y position of the node in pixels.
	 * NOTE: The spec does not define value range. Safe to use largest signed interger.
	 * NOTE: This type currently does not care bigint ranges.
	 */
	y: number;

	/**
	 * The width of the node in pixels
	 * NOTE: The spec does not defined value range.
	 *       Safe to use largest unsigned integer, with minimum value guard on parsing.
	 */
	width: number;

	/**
	 * The height of the node in pixels
	 * NOTE: The spec does not defined value range.
	 *       Safe to use largest unsigned integer, with minimum value guard on parsing.
	 */
	height: number;

	/**
	 * The color of the node.
	 */
	color?: CanvasColor;
}

export function isGenericNode(x: unknown): x is GenericNode {
	if (typeof x !== "object" || !x) {
		return false;
	}

	if (!("id" in x) || typeof x.id !== "string") {
		return false;
	}

	if (!("type" in x) || typeof x.type !== "string") {
		return false;
	}

	if (!("x" in x) || typeof x.x !== "number" || !Number.isFinite(x.x)) {
		return false;
	}

	if (!("y" in x) || typeof x.y !== "number" || !Number.isFinite(x.y)) {
		return false;
	}

	if (
		!("width" in x) || typeof x.width !== "number" || !Number.isFinite(x.width)
	) {
		return false;
	}

	if (
		!("height" in x) || typeof x.height !== "number" ||
		!Number.isFinite(x.height)
	) {
		return false;
	}

	if ("color" in x && !isCanvasColor(x.color)) {
		return false;
	}

	return true;
}

export interface TextNode extends GenericNode {
	type: "text";

	/**
	 * Plain text with Markdown syntax.
	 * NOTE: Although the spec does not define what "Markdown" is, Obsidian seems to
	 *       using/parsing their Obsidian Flavored Markdown. Parsing and displaying
	 *       of this property is UB.
	 */
	text: string;
}

export function isTextNode(x: GenericNode): x is TextNode {
	if (x.type !== "text") {
		return false;
	}

	if (!("text" in x) || typeof x.text !== "string") {
		return false;
	}

	return true;
}

export interface FileNode extends GenericNode {
	type: "file";

	/**
	 * The path to the file within the system.
	 * NOTE: Syntax (e.g. what separator to use?) and resolution is UB.
	 */
	file: string;

	/**
	 * A subpath that may link to a heading or a block. Always starts with a #.
	 * NOTE: Both "a heading" and "a block" are not defined in the spec, UB.
	 */
	subpath?: `#${string}`;
}

export function isFileNode(x: GenericNode): x is FileNode {
	if (x.type !== "file") {
		return false;
	}

	if (!("file" in x) || typeof x.file !== "string") {
		return false;
	}

	if (
		"subpath" in x &&
		!(typeof x.subpath === "string" && x.subpath.startsWith("#"))
	) {
		return false;
	}

	return true;
}

export interface LinkNode extends GenericNode {
	type: "link";

	/**
	 * NOTE: Format is not defined in the spec.
	 */
	url: string;
}

export function isLinkNode(x: GenericNode): x is LinkNode {
	if (x.type !== "link") {
		return false;
	}

	if (!("url" in x && typeof x.url === "string")) {
		return false;
	}

	return true;
}

export interface GroupNode extends GenericNode {
	type: "group";

	/**
	 * A text label for the group.
	 * NOTE: Length range and available characters are not defined in the spec.
	 */
	label?: string;

	/**
	 * The path to the background image.
	 * NOTE: Syntax (e.g. what separator to use?) and resolution is UB.
	 */
	background?: string;

	/**
	 * the rendering style of the background image. Valid values:
	 * - `cover`  ... fills the entire width and height of the node.
	 * - `ratio`  ... maintains the aspect ratio of the background image.
	 * - `repeat` ... repeats the image as a pattern in both x/y directions.
	 * NOTE: UB when the field is empty.
	 */
	backgroundStyle?: "cover" | "ratio" | "repeat";
}

export function isGroupNode(x: GenericNode): x is GroupNode {
	if (x.type !== "group") {
		return false;
	}

	if ("label" in x && typeof x.label !== "string") {
		return false;
	}

	if ("background" in x && typeof x.background !== "string") {
		return false;
	}

	if ("backgroundStyle" in x) {
		switch (x.backgroundStyle) {
			case "cover":
			case "ratio":
			case "repeat":
				break;
			default:
				return false;
		}
	}

	return true;
}

export type Node = TextNode | FileNode | LinkNode | GroupNode;

export function isNode(x: unknown): x is Node {
	if (!isGenericNode(x)) {
		return false;
	}

	return isTextNode(x) || isFileNode(x) || isLinkNode(x) || isGroupNode(x);
}

export type NodeSide = "top" | "right" | "bottom" | "left";

export function isNodeSide(x: unknown): x is NodeSide {
	switch (x) {
		case "top":
		case "right":
		case "bottom":
		case "left":
			return true;
		default:
			return false;
	}
}

export type EdgeEnd = "none" | "arrow";

export function isEdgeEnd(x: unknown): x is EdgeEnd {
	return x === "none" || x === "arrow";
}

export interface Edge {
	/**
	 * A unique ID for the edge.
	 * NOTE: Length range and available characters are not defined in the spec.
	 */
	id: string;

	/**
	 * The node `id` where the connection starts.
	 * NOTE: Pointing non-existent `id` is UB.
	 */
	fromNode: string;

	/**
	 * The side where this edge starts.
	 * NOTE: UB when the field is empty.
	 */
	fromSide?: NodeSide;

	/**
	 * The shape of the endpoint at the edge start.
	 * NOTE: UB when the field is empty.
	 */
	fromEnd?: EdgeEnd;

	/**
	 * The node `id` where the connection ends.
	 * NOTE: Pointing non-existent `id` is UB.
	 */
	toNode: string;

	/**
	 * The side where this edge ends.
	 * NOTE: UB when the field is empty.
	 */
	toSide?: NodeSide;

	/**
	 * The shape of the endpoint at the edge end.
	 * NOTE: UB when the field is empty.
	 */
	toEnd?: EdgeEnd;

	/**
	 * The color of the line.
	 */
	color?: CanvasColor;

	/**
	 * A text label for the edge.
	 * NOTE: Length range and available characters are not defined in the spec.
	 */
	label?: string;
}

export function isEdge(x: unknown): x is Edge {
	if (typeof x !== "object" || !x) {
		return false;
	}

	if (!("id" in x) || typeof x.id !== "string") {
		return false;
	}

	if (!("fromNode" in x) || typeof x.fromNode !== "string") {
		return false;
	}

	if ("fromSide" in x && !isNodeSide(x.fromSide)) {
		return false;
	}

	if ("fromEnd" in x && !isEdgeEnd(x.fromEnd)) {
		return false;
	}

	if (!("toNode" in x) || typeof x.toNode !== "string") {
		return false;
	}

	if ("toSide" in x && !isNodeSide(x.toSide)) {
		return false;
	}

	if ("toEnd" in x && !isEdgeEnd(x.toEnd)) {
		return false;
	}

	if ("color" in x && !isCanvasColor(x.color)) {
		return false;
	}

	if ("label" in x && typeof x.label !== "string") {
		return false;
	}

	return true;
}

export interface JSONCanvas {
	nodes?: Node[];
	edges?: Edge[];
}

export function isJSONCanvas(x: unknown): x is JSONCanvas {
	if (typeof x !== "object" || !x) {
		return false;
	}

	if ("nodes" in x && !(Array.isArray(x.nodes) && x.nodes.every(isNode))) {
		return false;
	}

	if ("edges" in x && !(Array.isArray(x.edges) && x.edges.every(isEdge))) {
		return false;
	}

	return true;
}
