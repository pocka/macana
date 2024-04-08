// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../deps/deno.land/x/nano_jsx/mod.ts";

import { css } from "../css.ts";

import type {
	CanvasColor,
	JSONCanvas,
	Node,
	NodeSide,
} from "../../../content_parser/json_canvas/types.ts";

const enum C {
	Wrapper = "jcr--wr",
}

export const styles = css`
	.${C.Wrapper} {
		overflow: auto;
		max-width: 100%;
		max-height: 80dvh;
		margin-top: calc(var(--baseline) * 1rem);

		border: 1px solid var(--color-border);
		border-radius: calc(1rem / 4);
		padding: 4px;
	}
`;

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

// TODO: Automatically calculate padding based on stroke-width, edges and shadows.
function getBoundingBox(canvas: JSONCanvas, padding: number = 20): Rect {
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

type Point2D = readonly [number, number];

function getConnectionPoint(node: Node, side: NodeSide): Point2D {
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

type Vec2D = Point2D;

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
function getNearestSideToPoint(node: Node, p: Point2D): NodeSide {
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

function getClosestSides(
	a: Node,
	aSide: NodeSide | undefined,
	b: Node,
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

function getDirV(side: NodeSide): Vec2D {
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

function vecMul(a: Vec2D, b: Vec2D): Vec2D {
	return [a[0] * b[0], a[1] * b[1]];
}

function move(p: Point2D, v: Vec2D): Point2D {
	return [p[0] + v[0], p[1] + v[1]];
}

function canvasColorToCssColor(color: CanvasColor): string {
	switch (color) {
		case "1":
			return "var(--canvas-color-red)";
		case "2":
			return "var(--canvas-color-orange)";
		case "3":
			return "var(--canvas-color-yellow)";
		case "4":
			return "var(--canvas-color-green)";
		case "5":
			return "var(--canvas-color-cyan)";
		case "6":
			return "var(--canvas-color-purple)";
		default:
			return color;
	}
}

interface EdgeArrowProps {
	target: Point2D;

	pointTo: NodeSide;

	size?: number;

	fill?: string;
	stroke?: string;
}

function EdgeArrow({ target, pointTo, size = 15, ...rest }: EdgeArrowProps) {
	const start = `M${target[0]},${target[1]}`;
	const width = size * 1.2;

	let v1: Vec2D;
	let v2: Vec2D;
	switch (pointTo) {
		case "top":
			v1 = [-width * 0.5, -size];
			v2 = [width, 0];
			break;
		case "right":
			v1 = [size, -width * 0.5];
			v2 = [0, width];
			break;
		case "bottom":
			v1 = [width * 0.5, size];
			v2 = [-width, 0];
			break;
		case "left":
			v1 = [-size, -width * 0.5];
			v2 = [0, width];
			break;
	}

	return (
		<path
			{...rest}
			d={[start, `l${v1[0]},${v1[1]}`, `l${v2[0]},${v2[1]}`, start, "Z"].join(
				" ",
			)}
		/>
	);
}

export interface JSONCanvasRendererProps {
	data: JSONCanvas;

	radius?: number;

	arrowSize?: number;
}

export function JSONCanvasRenderer(
	{ data, radius = 6, arrowSize = 20 }: JSONCanvasRendererProps,
) {
	const boundingBox = getBoundingBox(data);

	const viewBox = [
		boundingBox.x,
		boundingBox.y,
		boundingBox.width,
		boundingBox.height,
	].map((n) => n.toFixed(0)).join(" ");

	/**
	 * Edges refer nodes by ID. This map helps and optimizes its retrieving operation.
	 * Without using `Map`, lookup takes `O(N)`.
	 */
	const nodes = new Map<string, Node>(
		data.nodes?.map((node) => [node.id, node]),
	);

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewbox={viewBox}
			data-original-width={boundingBox.width}
			data-original-height={boundingBox.height}
		>
			<filter id="shadow">
				<feDropShadow
					dx="0.0"
					dy="0.5"
					stdDeviation="3"
				/>
			</filter>
			{data.nodes?.map((node) => {
				const color = node.color
					? canvasColorToCssColor(node.color)
					: "var(--canvas-color-fallback)";

				return (
					<g>
						<rect
							x={node.x}
							y={node.y}
							width={node.width}
							height={node.height}
							fill="var(--color-bg)"
							rx={radius}
							ry={radius}
							stroke-width="var(--canvas-node-stroke-width)"
							style="filter: url(#shadow);"
						/>
						<rect
							x={node.x}
							y={node.y}
							width={node.width}
							height={node.height}
							fill={color}
							fill-opacity="var(--canvas-node-bg-opacity)"
							stroke={color}
							stroke-width="var(--canvas-node-stroke-width)"
							rx={radius}
							ry={radius}
						/>
						{node.type === "text" && (
							<foreignObject
								x={node.x}
								y={node.y}
								width={node.width}
								height={node.height}
							>
								<div
									xmlns="http://www.w3.org/1999/xhtml"
									style="padding: 1em;white-space: pre-wrap;"
								>
									{node.text}
								</div>
							</foreignObject>
						)}
					</g>
				);
			})}
			{data.edges?.map((edge) => {
				const color = edge.color
					? canvasColorToCssColor(edge.color)
					: "var(--canvas-color-fallback)";

				const fromNode = nodes.get(edge.fromNode);
				if (!fromNode) {
					// TODO: Proper logging
					console.warn(
						`JSONCanvas Renderer: Edge(id=${edge.id}) points to non-existing fromNode(id=${edge.fromNode})`,
					);
					return;
				}

				const toNode = nodes.get(edge.toNode);
				if (!toNode) {
					// TODO: Proper logging
					console.warn(
						`JSONCanvas Renderer: Edge(id=${edge.id}) points to non-existing toNode(id=${edge.toNode})`,
					);
					return;
				}

				const [fromSide, toSide] = getClosestSides(
					fromNode,
					edge.fromSide,
					toNode,
					edge.toSide,
				);

				const fromOffsetUnitVec = getDirV(fromSide);
				const toOffsetUnitVec = getDirV(toSide);

				// Not defined in spec or documents, but Obsidian Canvas uses
				// different defaults. wtf
				const fromEnd = edge.fromEnd ?? "none";
				const toEnd = edge.toEnd ?? "arrow";

				const fromPoint = getConnectionPoint(fromNode, fromSide);
				const toPoint = getConnectionPoint(toNode, toSide);

				// Subtract by 1 otherwise tiny gap appears.
				const fromStart = fromEnd === "arrow"
					? move(
						fromPoint,
						vecMul(fromOffsetUnitVec, [arrowSize - 1, arrowSize - 1]),
					)
					: fromPoint;
				const toStart = toEnd === "arrow"
					? move(
						toPoint,
						vecMul(toOffsetUnitVec, [arrowSize - 1, arrowSize - 1]),
					)
					: toPoint;

				const center: Point2D = [
					(toStart[0] + fromStart[0]) / 2,
					(toStart[1] + fromStart[1]) / 2,
				];

				// TODO: Improve Bezier control points: Most of curves looks nearly perfect,
				//       but Obsidian seems to employ special handling when a connector
				//       overlaps with a node.
				const p1: Point2D = move(
					fromStart,
					vecMul(fromOffsetUnitVec, [
						Math.abs(center[0] - fromStart[0]),
						Math.abs(center[1] - fromStart[1]),
					]),
				);
				const p2: Point2D = move(
					toStart,
					vecMul(toOffsetUnitVec, [
						Math.abs(toStart[0] - center[0]),
						Math.abs(toStart[1] - center[1]),
					]),
				);

				const d = [
					`M ${fromStart[0]},${fromStart[1]}`,
					`C ${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${toStart[0]},${toStart[1]}`,
				].join(" ");

				return (
					<g>
						<path
							d={d}
							stroke={color}
							stroke-width="var(--canvas-edge-stroke-width)"
							fill="none"
						/>
						{edge.fromEnd === "arrow" && (
							<EdgeArrow
								target={fromPoint}
								pointTo={fromSide}
								fill={color}
								size={arrowSize}
							/>
						)}
						{edge.toEnd !== "none" && (
							<EdgeArrow
								target={toPoint}
								pointTo={toSide}
								fill={color}
								size={arrowSize}
							/>
						)}
					</g>
				);
			})}
		</svg>
	);
}

export type ViewProps = JSONCanvasRendererProps;

export function View({ data }: ViewProps) {
	return (
		<div className={C.Wrapper}>
			<JSONCanvasRenderer data={data} />
		</div>
	);
}
