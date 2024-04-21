// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import type {
	JSONCanvas,
	Node,
	NodeSide,
} from "../../../../../content_parser/json_canvas/types.ts";

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

// TODO: Automatically calculate padding based on stroke-width, edges and shadows.
export function getBoundingBox(
	canvas: JSONCanvas<unknown>,
	padding: number = 20,
): Rect {
	let minX: number = 0;
	let minY: number = 0;
	let maxX: number = 0;
	let maxY: number = 0;

	for (const node of canvas.nodes ?? []) {
		minX = Math.min(node.x, minX);
		minY = Math.min(node.y, minY);
		maxX = Math.max(node.x + node.width, maxX);
		maxY = Math.max(node.y + node.height, maxY);
	}

	return {
		x: minX - padding * 0.5,
		y: minY - padding * 0.5,
		width: maxX - minX + padding,
		height: maxY - minY + padding,
	};
}

export type Point2D = readonly [number, number];

export function getConnectionPoint(
	node: Node<unknown>,
	side: NodeSide,
): Point2D {
	switch (side) {
		case "top":
			return [node.x + node.width * 0.5, node.y];
		case "right":
			return [node.x + node.width, node.y + node.height * 0.5];
		case "bottom":
			return [node.x + node.width * 0.5, node.y + node.height];
		case "left":
			return [node.x, node.y + node.height * 0.5];
	}
}

export type Vec2D = Point2D;

function dot(a: Vec2D, b: Vec2D): number {
	return a[0] * b[0] + a[1] * b[1];
}

function magnitude(v: Vec2D): number {
	return Math.sqrt(v[0] ** 2 + v[1] ** 2);
}

/**
 * Which node side faces the point?
 * We need this function because `fromSide` and `toSide` property is optional...
 * but Obsidian does not render Canvas if either of one is missing. wtf
 */
export function getNearestSideToPoint(
	node: Node<unknown>,
	p: Point2D,
): NodeSide {
	const center: Point2D = [
		node.x + node.width * 0.5,
		node.y + node.height * 0.5,
	];

	// First, we get a vector from node's center to the target point.
	// The line segment intersecting with this vector is the face we want.
	const vp: Vec2D = [p[0] - center[0], p[1] - center[1]];

	// Determine the angle between a vector (0, 1) and `vp` (center to point).
	// We test with angle instead of line segment intersection: the latter requires
	// many calculation and range checkings, which I can't handle.
	const vd: Vec2D = [0, 1];
	const angleToPointRad: number = Math.acos(
		dot(vp, vd) / (magnitude(vp) * magnitude(vd)),
	);

	// As the node is rectangle not square, we can't simply switch at 45deg.
	// However, for this usecase, we only need single diagonal (because it's rect).
	const diag: number = magnitude([node.width, node.height]);
	const diagYAngleRad: number = Math.PI -
		2 *
			(Math.acos(
				(node.width ** 2 + diag ** 2 - node.height ** 2) /
					(2 * node.width * diag),
			));

	// Because the angle above is diag-to-diag but we need to test against
	// angle of [0, 1] to `vp`, halve the angle so it can be an angle of
	// [0, 1] to diag.
	const bottomRight: number = diagYAngleRad * 0.5;

	if (angleToPointRad <= bottomRight) {
		return "bottom";
	}

	const topRight = Math.PI - bottomRight;
	if (angleToPointRad <= topRight) {
		// The angle does not have direction, hence we need to check if the vector
		// is directing right or left.
		return vp[0] > 0 ? "right" : "left";
	}

	// Angle can't be more than 180deg, so no need for more tests.
	return "top";
}

export function getClosestSides(
	a: Node<unknown>,
	aSide: NodeSide | undefined,
	b: Node<unknown>,
	bSide: NodeSide | undefined,
): readonly [NodeSide, NodeSide] {
	if (aSide && bSide) {
		return [aSide, bSide];
	}

	if (aSide) {
		return [aSide, getNearestSideToPoint(b, getConnectionPoint(a, aSide))];
	}

	if (bSide) {
		return [getNearestSideToPoint(a, getConnectionPoint(b, bSide)), bSide];
	}

	const ca: Point2D = [a.x + a.width * 0.5, a.y + a.height * 0.5];
	const cb: Point2D = [b.x + b.width * 0.5, b.y + b.height * 0.5];

	return [getNearestSideToPoint(a, cb), getNearestSideToPoint(b, ca)];
}

export function getDirV(side: NodeSide): Vec2D {
	switch (side) {
		case "top":
			return [0, -1];
		case "right":
			return [1, 0];
		case "bottom":
			return [0, 1];
		case "left":
			return [-1, 0];
	}
}

export function vecMul(a: Vec2D, b: Vec2D): Vec2D {
	return [a[0] * b[0], a[1] * b[1]];
}

export function move(p: Point2D, v: Vec2D): Point2D {
	return [p[0] + v[0], p[1] + v[1]];
}
