// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { logger } from "../../../../logger.ts";

import { css } from "../../css.ts";

import type {
	CanvasColor,
	JSONCanvas,
	Node,
	NodeSide,
} from "../../../../content_parser/json_canvas/types.ts";

import {
	getBoundingBox,
	getClosestSides,
	getConnectionPoint,
	getDirV,
	move,
	type Point2D,
	type Vec2D,
	vecMul,
} from "./json_canvas_renderer/layout.ts";

const enum C {
	Wrapper = "jcr--wr",
	Embed = "jcr--em",
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

	.${C.Embed} {
		padding: 4px 8px;
		overflow: auto;
	}
	.${C.Embed} > p {
		margin-block-start: calc(var(--baseline) * 0.5rem);
	}
	.${C.Embed} > :first-child {
		margin-block-start: 0;
	}
`;

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
	// nano-jsx does not ship working typings, thus "unknown" (no JSX.Element).
	data: JSONCanvas<unknown>;

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
	const nodes = new Map<string, Node<unknown>>(
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
									style={`width: ${node.width}px;height: ${node.height}px;`}
									className={C.Embed}
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
					logger().warn(
						"Malformed JSONCanvas: " +
							`Edge(id=${edge.id}) points to non-existing fromNode(id=${edge.fromNode})`,
						{
							edge,
						},
					);
					return;
				}

				const toNode = nodes.get(edge.toNode);
				if (!toNode) {
					logger().warn(
						"Malformed JSONCanvas: " +
							`Edge(id=${edge.id}) points to non-existing toNode(id=${edge.toNode})`,
						{
							edge,
						},
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
