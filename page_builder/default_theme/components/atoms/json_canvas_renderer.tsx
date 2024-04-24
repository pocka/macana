// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */
/** @jsxFrag Fragment */

import { extname } from "../../../../deps/deno.land/std/path/mod.ts";
import { Fragment, h } from "../../../../deps/deno.land/x/nano_jsx/mod.ts";

import { logger } from "../../../../logger.ts";

import { css } from "../../css.ts";

import type {
	CanvasColor,
	FileNode,
	GroupNode,
	JSONCanvas,
	LinkNode,
	Node,
	NodeSide,
	TextNode,
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

interface TextNodeRendererProps {
	node: TextNode<unknown>;
}

function TextNodeRenderer({ node }: TextNodeRendererProps) {
	const containerStyle: StyleConstructor = {
		width: node.width,
		height: node.height,
	};

	// NOTE: Safari can't render `<foreignObject>` correctly.
	// In this case, Safari renders an overflowing element at completely incorrect
	// position and size, which makes the element invisible (outside viewport).
	// https://github.com/mdn/content/issues/1319
	// https://bugs.webkit.org/show_bug.cgi?id=90738
	// https://bugs.webkit.org/show_bug.cgi?id=23113
	return (
		<foreignObject
			x={node.x}
			y={node.y}
			width={node.width}
			height={node.height}
		>
			<div
				xmlns="http://www.w3.org/1999/xhtml"
				style={constructStyle(containerStyle)}
				className={C.Embed}
			>
				{node.text}
			</div>
		</foreignObject>
	);
}

interface LinkNodeRendererProps {
	node: LinkNode;
}

function LinkNodeRenderer({ node }: LinkNodeRendererProps) {
	const iframeStyles: StyleConstructor = {
		width: node.width,
		height: node.height,
	};

	// NOTE: Safari can't render `<foreignObject>` correctly.
	// In this case, Safari renders an overflowing element at completely incorrect
	// position and size, which makes the element invisible (outside viewport).
	// https://github.com/mdn/content/issues/1319
	// https://bugs.webkit.org/show_bug.cgi?id=90738
	// https://bugs.webkit.org/show_bug.cgi?id=23113
	return (
		<foreignObject
			x={node.x}
			y={node.y}
			width={node.width}
			height={node.height}
		>
			<iframe
				xmlns="http://www.w3.org/1999/xhtml"
				style={constructStyle(iframeStyles)}
				src={node.url}
			/>
		</foreignObject>
	);
}

interface FileNodeRendererProps {
	node: FileNode;
}

function FileNodeRenderer({ node }: FileNodeRendererProps) {
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
				<foreignObject
					x={node.x}
					y={node.y}
					width={node.width}
					height={node.height}
				>
					<img
						xmlns="http://www.w3.org/1999/xhtml"
						style="max-width:100%;max-height:100%;object-fit:contain;"
						src={node.file}
					/>
				</foreignObject>
			);
		}
		case ".mkv":
		case ".mov":
		case ".mp4":
		case ".ogv":
		case ".webm": {
			return (
				<foreignObject
					x={node.x}
					y={node.y}
					width={node.width}
					height={node.height}
				>
					<video
						xmlns="http://www.w3.org/1999/xhtml"
						style="max-width:100%;max-height:100%;object-fit:contain;"
						src={node.file}
					/>
				</foreignObject>
			);
		}
		case ".flac":
		case ".m4a":
		case ".mp3":
		case ".ogg":
		case ".wav":
		case ".3gp": {
			return (
				<foreignObject
					x={node.x}
					y={node.y}
					width={node.width}
					height={node.height}
				>
					<div
						xmlns="http://www.w3.org/1999/xhtml"
						style="width:100%;height:100%;display:grid;place-items:center;"
					>
						<audio src={node.file} />
					</div>
				</foreignObject>
			);
		}
		default: {
			return (
				<foreignObject
					x={node.x}
					y={node.y}
					width={node.width}
					height={node.height}
				>
					<iframe
						xmlns="http://www.w3.org/1999/xhtml"
						style={`width: ${node.width}px;height: ${node.height}px;`}
						src={node.file}
						sandbox="allow-scripts"
						loading="lazy"
					/>
				</foreignObject>
			);
		}
	}
}

type VerticalAlign = "top" | "center" | "bottom";
type HorizontalAlign = "left" | "center" | "right";

interface BoxTextProps {
	label: string;

	x?: number;
	y?: number;

	fontSize?: number;

	color?: string;
	background?: string;
	radius?: number;
	padding?: number;

	vAlign?: VerticalAlign;
	hAlign?: HorizontalAlign;
}

/**
 * Renders text with background and padding.
 * SVG does not have this functionality, so we need to roll our own...
 */
function BoxText(
	{
		label,
		x = 0,
		y = 0,
		fontSize = 16,
		color,
		background,
		radius = 0,
		padding = 0,
		vAlign = "center",
		hAlign = "center",
	}: BoxTextProps,
) {
	const safeWidth = label.length * fontSize * 10;
	const safeHeight = label.split("\n").length * fontSize * 10;

	const spanStyles: StyleConstructor = {
		"font-size": fontSize + "px",
		color,
		"background-color": background,
		padding,
		"border-radius": radius,
		// Make text selectable
		"pointer-events": "auto",
	};
	let containerX: number;
	switch (hAlign) {
		case "left":
			containerX = x;
			break;
		case "center":
			containerX = x - safeWidth * 0.5;
			break;
		case "right":
			containerX = x - safeWidth;
			break;
	}

	let containerY: number;
	switch (vAlign) {
		case "top":
			containerY = y;
			break;
		case "center":
			containerY = y - safeHeight * 0.5;
			break;
		case "bottom":
			containerY = y - safeHeight;
			break;
	}

	const layoutStyles: StyleConstructor = {
		width: "100%",
		height: "100%",
		display: "flex",
		"justify-content": hAlign === "center"
			? "center"
			: hAlign === "right"
			? "end"
			: "start",
		"align-items": vAlign === "center"
			? "center"
			: vAlign === "bottom"
			? "end"
			: "start",
		// Prevent blank area from stealing user clicks
		"pointer-events": "none",
	};

	return (
		<foreignObject
			x={containerX}
			y={containerY}
			width={safeWidth}
			height={safeHeight}
			style="pointer-events:none;"
		>
			<div
				xmlns="http://www.w3.org/1999/xhtml"
				style={constructStyle(layoutStyles)}
			>
				<span
					style={constructStyle(spanStyles)}
				>
					{label}
				</span>
			</div>
		</foreignObject>
	);
}

interface GroupNodeRendererProps {
	node: GroupNode;
}

function GroupNodeRenderer({ node }: GroupNodeRendererProps) {
	if (!node.label) {
		return <></>;
	}

	const color = node.color
		? canvasColorToCssColor(node.color)
		: "var(--canvas-color-fallback)";

	// TODO: Make fg color configurable
	return (
		<BoxText
			x={node.x}
			y={node.y - 6}
			background={color}
			color="var(--color-bg)"
			padding={4}
			radius={3}
			fontSize={20}
			label={node.label}
			hAlign="left"
			vAlign="bottom"
		/>
	);
}

interface NodeRendererProps {
	node: Node<unknown>;
}

function NodeRenderer({ node }: NodeRendererProps) {
	switch (node.type) {
		case "text":
			return <TextNodeRenderer node={node} />;
		case "link":
			return <LinkNodeRenderer node={node} />;
		case "file":
			return <FileNodeRenderer node={node} />;
		case "group":
			return <GroupNodeRenderer node={node} />;
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
						<NodeRenderer node={node} />
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
						{edge.label && (
							<BoxText
								label={edge.label}
								x={(p1[0] + p2[0]) * 0.5}
								y={(p1[1] + p2[1]) * 0.5}
								background="var(--color-bg)"
								color="var(--color-fg)"
								fontSize={18}
								padding={4}
								radius={2}
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
