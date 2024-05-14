// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx s */

import { extname } from "../../../deps/deno.land/std/path/mod.ts";
import type * as Hast from "../../../deps/esm.sh/hast/types.ts";
import { h, s } from "../../../deps/esm.sh/hastscript/mod.ts";

import { logger } from "../../../logger.ts";
import type {
	CanvasColor,
	Edge,
	FileNode,
	GroupNode,
	JSONCanvas,
	LinkNode,
	Node,
	NodeSide,
	TextNode,
} from "../../../content_parser/json_canvas/types.ts";

import { buildClasses, css, cx } from "../css.ts";

import {
	getBoundingBox,
	getClosestSides,
	getConnectionPoint,
	getDirV,
	move,
	type Point2D,
	type Vec2D,
	vecMul,
} from "./layout.ts";

const c = buildClasses("jc", [
	"embed",
	"canvas",
	"nodeContainer",
	"nodeBg",
	"vectorCanvas",
	"groupNode",
	"iframe",
	"edgeLabel",
]);

export const jsonCanvasStyles = css`
	.${c.canvas} {
		position: relative;
	}

	.${c.vectorCanvas} {
		position: absolute;
		inset: 0;

		pointer-events: none;
	}

	.${c.nodeContainer} {
		position: absolute;
		display: flex;
		justify-content: stretch;
		align-items: stretch;

		border-style: solid;
		border-width: var(--canvas-node-stroke-width);
		border-radius: var(--canvas-node-radius, 3px);
		box-shadow: 0 0 2px hsl(0deg 0% 0% / 0.2);
		overflow: visible;
	}

	.${c.nodeBg} {
		position: absolute;
		inset: 0;

		pointer-events: none;

		opacity: var(--canvas-node-bg-opacity);
	}

	.${c.embed} {
		width: 100%;
		height: 100%;
		padding: 4px 8px;
		overflow: auto;
	}
	.${c.embed} > p {
		margin-block-start: calc(var(--baseline) * 0.5rem);
	}
	.${c.embed} > :first-child {
		margin-block-start: 0;
	}

	.${c.groupNode} {
		position: absolute;
		top: -6px;
		left: 0;
		padding: 2px 0.5em;

		border-radius: 3px;

		transform: translateY(-100%);
	}

	.${c.iframe} {
		width: 100%;
		height: 100%;
		border: none;
	}

	.${c.edgeLabel} {
		position: absolute;
		display: inline-block;
		padding: 2px 0.5em;
		font-size: 0.9rem;

		background-color: var(--color-bg);
		border-radius: 2px;
		color: var(--color-fg);

		transform: translate(-50%, -50%);
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

interface StyleConstructor {
	[key: string]: string | number | undefined | null;
}

function constructStyle(c: StyleConstructor): string {
	return Object.entries(c).map(([key, value]) => {
		if (!value) {
			return null;
		}

		return key + ":" + (typeof value === "number" ? value + "px" : value);
	}).filter((s): s is string => !!s).join(";");
}

interface TextNodeProps {
	className?: string;

	node: TextNode<Hast.Nodes>;
}

function textNode({ node, className }: TextNodeProps) {
	return <div class={cx(className, c.embed)}>{node.text}</div>;
}

interface LinkNodeProps {
	className?: string;

	node: LinkNode;
}

function linkNode({ node, className }: LinkNodeProps) {
	return (
		<iframe
			class={cx(className, c.iframe)}
			src={node.url}
			width={node.width}
			height={node.height}
		/>
	);
}

interface FileNodeProps {
	className?: string;

	node: FileNode;
}

function fileNode({ className, node }: FileNodeProps) {
	const ext = extname(node.file);

	switch (ext) {
		case ".jpg":
		case ".jpeg":
		case ".avif":
		case ".bmp":
		case ".png":
		case ".svg":
		case ".webp": {
			return (
				<img
					class={className}
					style="max-width:100%;max-height:100%;object-fit:contain;"
					src={node.file}
				/>
			);
		}
		case ".mkv":
		case ".mov":
		case ".mp4":
		case ".ogv":
		case ".webm": {
			return (
				<video
					class={className}
					style="max-width:100%;max-height:100%;object-fit:contain;"
					src={node.file}
				/>
			);
		}
		case ".flac":
		case ".m4a":
		case ".mp3":
		case ".ogg":
		case ".wav":
		case ".3gp": {
			return (
				<div
					class={className}
					style="width:100%;height:100%;display:grid;place-items:center;"
				>
					<audio src={node.file} />
				</div>
			);
		}
		default: {
			return (
				<iframe
					class={cx(className, c.iframe)}
					src={node.file}
					sandbox="allow-scripts"
					loading="lazy"
					width={node.width}
					height={node.height}
				/>
			);
		}
	}
}

interface GroupNodeProps {
	node: GroupNode;
}

function groupNode({ node }: GroupNodeProps) {
	if (!node.label) {
		return null;
	}

	const color = node.color
		? canvasColorToCssColor(node.color)
		: "var(--canvas-color-fallback)";

	return h("span", {
		className: c.groupNode,
		style: constructStyle({
			"background-color": color,
			// TODO: Make fg color configurable
			color: "var(--color-bg)",
		}),
	}, [
		node.label,
	]);
}

interface NodeRendererProps {
	node: Node<Hast.Nodes>;

	scrollClassName?: string;
}

function nodeRenderer({ node, scrollClassName }: NodeRendererProps) {
	switch (node.type) {
		case "text":
			return textNode({ className: scrollClassName, node });
		case "link":
			return linkNode({ className: scrollClassName, node });
		case "file":
			return fileNode({ node });
		case "group":
			return groupNode({ node });
	}
}

interface EdgeArrowProps {
	target: Point2D;

	pointTo: NodeSide;

	size?: number;

	fill?: string;
	stroke?: string;
}

function edgeArrow({ target, pointTo, size = 15, ...rest }: EdgeArrowProps) {
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

interface ComputedEdge {
	edge: Edge;

	fromSide: NodeSide;
	toSide: NodeSide;

	fromStart: Point2D;
	toStart: Point2D;

	fromPoint: Point2D;
	toPoint: Point2D;

	controlPoints: readonly [Point2D, Point2D];
}

function computeEdge(
	edge: Edge,
	nodes: Map<string, Node<unknown>>,
	arrowSize: number,
): ComputedEdge | null {
	const fromNode = nodes.get(edge.fromNode);
	if (!fromNode) {
		logger().warn(
			"Malformed JSONCanvas: " +
				`Edge(id=${edge.id}) points to non-existing fromNode(id=${edge.fromNode})`,
			{
				edge,
			},
		);
		return null;
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
		return null;
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

	// Bezier control points.
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

	return {
		edge,
		fromSide,
		toSide,
		fromStart,
		toStart,
		fromPoint,
		toPoint,
		controlPoints: [p1, p2],
	};
}

export interface JSONCanvasProps {
	className?: string;

	data: JSONCanvas<Hast.Nodes>;

	arrowSize?: number;

	/**
	 * Class to add to elements which are scrollable.
	 */
	scrollClassName?: string;
}

export function jsonCanvas(
	{ className, data, arrowSize = 20, scrollClassName }: JSONCanvasProps,
) {
	const boundingBox = getBoundingBox(data);

	const viewBox = [
		boundingBox.x,
		boundingBox.y,
		boundingBox.width,
		boundingBox.height,
	].map((n) => n.toFixed(0)).join(" ");

	// Convert JSONCanvas coordinates to HTML(CSS)'s one
	const x = (v: number) => v - boundingBox.x;
	const y = (v: number) => v - boundingBox.y;

	/**
	 * Edges refer nodes by ID. This map helps and optimizes its retrieving operation.
	 * Without using `Map`, lookup takes `O(N)`.
	 */
	const nodes = new Map<string, Node<unknown>>(
		data.nodes?.map((node) => [node.id, node]),
	);

	const computedEdges = data.edges?.map((edge) =>
		computeEdge(edge, nodes, arrowSize)
	).filter((edge): edge is ComputedEdge => !!edge);

	return h("div", {
		className: cx(className, c.canvas),
		style: {
			width: boundingBox.width + "px",
			height: boundingBox.height + "px",
		},
	}, [
		data.nodes?.map((node) => {
			const color = node.color
				? canvasColorToCssColor(node.color)
				: "var(--canvas-color-fallback)";

			return h("div", {
				className: c.nodeContainer,
				style: {
					"border-color": color,
					left: x(node.x) + "px",
					top: y(node.y) + "px",
					width: node.width + "px",
					height: node.height + "px",
				},
			}, [
				h("div", {
					className: c.nodeBg,
					style: {
						"background-color": color,
					},
				}, []),
				nodeRenderer({ scrollClassName, node }),
			]);
		}),
		<svg
			class={c.vectorCanvas}
			xmlns="http://www.w3.org/2000/svg"
			viewbox={viewBox}
			style="width: 100%; height: 100%;"
		>
			{computedEdges?.map(
				(
					{
						edge,
						fromPoint,
						fromSide,
						fromStart,
						toStart,
						toPoint,
						toSide,
						controlPoints: [p1, p2],
					},
				) => {
					const color = edge.color
						? canvasColorToCssColor(edge.color)
						: "var(--canvas-color-fallback)";

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
							{edge.fromEnd === "arrow"
								? (
									edgeArrow({
										target: fromPoint,
										pointTo: fromSide,
										fill: color,
										size: arrowSize,
									})
								)
								: null}
							{edge.toEnd !== "none"
								? (
									edgeArrow({
										target: toPoint,
										pointTo: toSide,
										fill: color,
										size: arrowSize,
									})
								)
								: null}
						</g>
					);
				},
			)}
		</svg>,
		computedEdges?.map(({ edge, controlPoints: [p1, p2] }) => {
			if (!edge.label) {
				return null;
			}

			return h("span", {
				className: c.edgeLabel,
				style: {
					left: x((p1[0] + p2[0]) * 0.5) + "px",
					top: y((p1[1] + p2[1]) * 0.5) + "px",
				},
			}, [
				edge.label,
			]);
		}),
	]);
}
