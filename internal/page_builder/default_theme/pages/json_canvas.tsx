// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @jsx h */

import { h } from "../../../../deps/esm.sh/hastscript/mod.ts";
import type * as Hast from "../../../../deps/esm.sh/hast/types.ts";

import type { JSONCanvas } from "../../../content_parser/json_canvas/types.ts";

import type { DocumentBuildContext } from "../context.ts";
import { buildClasses, css, join } from "../css.ts";
import { javascript } from "../script.ts";

import { lucideIconStyles, zoomIn, zoomOut } from "../icons/lucide.tsx";
import { layout, layoutScript, layoutStyles } from "../widgets/layout.tsx";
import {
	documentTree,
	documentTreeScript,
	documentTreeStyles,
} from "../widgets/document_tree.tsx";
import { footer, footerStyles } from "../widgets/footer.tsx";
import { jsonCanvas, jsonCanvasStyles } from "../json_canvas/mod.tsx";

import { template } from "./template.tsx";

const c = buildClasses("p-jc", [
	"meta",
	"title",
	"canvas",
	"padding",
	"controls",
	"controlButton",
	"scrollableChild",
	"layout",
	"keyShortcutTip",
	"gestureEnabledContainer",
	"scale",
]);

const ownStyles = css`
	.${c.layout} {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
	}

	.${c.meta} {
		padding: 4px 1em;
		border-block-start: 1px solid var(--color-border);
		display: flex;
		justify-content: space-between;

		border-radius: 2px;
		background-color: var(--color-bg-accent);
		z-index: 2;
	}

	.${c.title} {
		margin: 0;
		font-weight: normal;
		font-size: 1rem;
		line-height: 1.5;
	}

	.${c.controls} {
		display: flex;
		align-items: center;
		gap: 4px 0.25em;
		line-height: 1;
		font-size: 0.9rem;

		color: var(--color-fg-sub);
	}

	.${c.controlButton} {
		appearance: none;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 1.5rem;
		height: 1.5rem;
		aspect-ratio: 1 / 1;
		border: none;
		padding: 0;
		margin: 0;

		background: transparent;
		border-radius: 2px;
		color: var(--color-fg);
		cursor: pointer;
	}
	.${c.controlButton}:hover {
		background-color: var(--color-subtle-overlay);
	}
	.${c.controlButton}:active {
		background-color: transparent;
		color: var(--color-fg-sub);
	}

	.${c.canvas} {
		position: relative;
		flex: 1;

		overflow: auto;
		touch-action: none;
		z-index: 1;
	}
	.${c.canvas}:focus-visible {
		box-shadow: inset 0 0 0 2px var(--color-primary);
	}
	.${c.gestureEnabledContainer}:focus-visible {
		box-shadow: none;
		outline: none;
	}

	.${c.padding} {
		display: inline-flex;
		padding: 8rem;
	}

	.${c.keyShortcutTip} {
		display: none;
		position: absolute;
		top: 2px;
		right: 2px;
		margin: 0;
		padding: 2px 0.5em;
		font-size: 0.9rem;
		border: 2px solid var(--color-primary);

		background-color: var(--color-bg-accent);
		border-radius: 3px;
		box-shadow: 1px 1px 2px hsl(0deg 0% 0% / 0.1);
		color: var(--color-fg);
	}

	.${c.gestureEnabledContainer}:focus-visible .${c.keyShortcutTip} {
		display: inline-block;
	}

	.${c.scale} {
		display: inline-block;
		min-width: 5ch;
		font-variant-numeric: tabular-nums;

		text-align: center;
	}
`;

export const jsonCanvasPageStyles = join(
	lucideIconStyles,
	layoutStyles,
	documentTreeStyles,
	footerStyles,
	jsonCanvasStyles,
	ownStyles,
);

const ownScript = javascript`
	function enchanceJSONCanvas() {
		let scale = 1.0;
		const SCALE_MIN = 0.3;
		const SCALE_MAX = 2.0;
		let tx = 0.0;
		let ty = 0.0;
		const DRAG_NONE = 0;
		const DRAG_IDLE = 1;
		const DRAG_DRAGGING = 2;
		let dragState = DRAG_NONE;
		let vx = 0;
		let vy = 0;
		let vw = 0;
		let vh = 0;
		const TOUCH_NONE = 0;
		const TOUCH_PAN = 1;
		const TOUCH_ZOOM = 2;
		let touchState = { type: TOUCH_NONE };

		const scaleLabel = document.getElementById("__macana_jc_scale");

		function setScale(v) {
			scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, v));

			if (scaleLabel) {
				scaleLabel.textContent = Math.round(scale * 100) + "%";
			}
		}

		for (const child of document.getElementsByClassName("${c.scrollableChild}")) {
			if (child.scrollHeight !== child.clientHeight) {
				child.addEventListener("wheel", ev => {
					if (!ev.ctrlKey) {
						ev.stopPropagation();
					}
				});
				child.addEventListener("touchstart", ev => {
					ev.stopPropagation();
				});
				child.addEventListener("touchmove", ev => {
					ev.stopPropagation();
				});
				child.addEventListener("touchend", ev => {
					ev.stopPropagation();
				});
			} else {
				child.style.touchAction = "none";
			}
		}

		const container = document.getElementById("__macana_jc_c");
		if (container) {
			container.classList.add("${c.gestureEnabledContainer}");

			const rect = container.getBoundingClientRect();
			vx = rect.x;
			vy = rect.y;
			vw = rect.width;
			vh = rect.height;

			const ro = new ResizeObserver(entries => {
				const rect = container.getBoundingClientRect();
				vx = rect.x;
				vy = rect.y;
				vw = rect.width;
				vh = rect.height;
			});
			ro.observe(container);

			container.style.overflow = "hidden";

			container.addEventListener("keydown", ev => {
				if (ev.target !== ev.currentTarget) {
					return;
				}

				switch (ev.key) {
					case "-":
						setScale(scale - 0.05);
						break;
					case "+":
						setScale(scale + 0.05);
						break;
					case "ArrowLeft":
						tx += 10 / scale;
						break;
					case "ArrowRight":
						tx -= 10 / scale;
						break;
					case "ArrowUp":
						ty += 10 / scale;
						break;
					case "ArrowDown":
						ty -= 10 / scale;
						break;
					default:
						return;
				}

				ev.preventDefault();
				ev.stopPropagation();
				applyTransformToCanvas();
			});

			container.addEventListener("pointermove", ev => {
				if (!(ev.buttons & 4 || dragState === DRAG_DRAGGING)) {
					return;
				}

				ev.preventDefault();
				ev.stopPropagation();

				tx += ev.movementX / scale;
				ty += ev.movementY / scale;
				applyTransformToCanvas();
			});

			container.addEventListener("pointerdown", ev => {
				if (dragState === DRAG_IDLE) {
					ev.preventDefault();
					ev.stopPropagation();
					dragState = DRAG_DRAGGING;
					syncCursor();
				}
			});

			container.addEventListener("pointerup", ev => {
				if (dragState === DRAG_DRAGGING) {
					ev.preventDefault();
					ev.stopPropagation();
					dragState = DRAG_IDLE;
					syncCursor();
				}
			});

			container.addEventListener("wheel", ev => {
				ev.preventDefault();
				if (ev.ctrlKey) {
					let deltaY = ev.deltaY;
					switch (ev.deltaMode) {
						case 1:
							deltaY *= 15;
							break;
						case 2:
							deltaY *= 100;
							break;
					}

					const prevScale = scale;
					setScale(scale * (1 - deltaY * 0.01));

					if (vw > 0 && vh > 0) {
						let offsetX = ev.offsetX;
						let offsetY = ev.offsetY;
						if (ev.target !== ev.currentTarget) {
							offsetX = ev.clientX - vx;
							offsetY = ev.clientY - vy;
						}
						const px = offsetX - vw * 0.5;
						const py = offsetY - vh * 0.5;
						tx += px / scale - px / prevScale;
						ty += py / scale - py / prevScale;
					}
				} else {
					tx -= ev.deltaX / scale;
					ty -= ev.deltaY / scale;
				}

				applyTransformToCanvas();
			}, { passive: false });

			container.addEventListener("touchstart", ev => {
				const firstTouch = ev.touches.item(0);
				if (!firstTouch) {
					return;
				}

				if (ev.touches.length >= 2) {
					const dist = getAvgTouchDist(ev.touches);
					if (dist === null) {
						return;
					}
					touchState = {
						type: TOUCH_ZOOM,
						initialScale: scale,
						initialDist: dist,
					};
					return;
				}

				touchState = {
					type: TOUCH_PAN,
					initialTouch: firstTouch,
					initialX: tx,
					initialY: ty,
				};
			});

			container.addEventListener("touchend", ev => {
				switch (ev.touches.length) {
					case 0:
						touchState = { type: TOUCH_NONE };
						return;
					case 1:
						touchState = {
							type: TOUCH_PAN,
							initialTouch: ev.touches.item(0),
							initialX: tx,
							initialY: ty,
						};
						return;
					case 2: {
						const dist = getAvgTouchDist(ev.touches);
						if (dist === null) {
							return;
						}

						touchState = {
							type: TOUCH_ZOOM,
							initialScale: scale,
							initialDist: dist,
						};
						return;
					}
				}
			});

			container.addEventListener("touchcancel", ev => {
				touchState = { type: TOUCH_NONE };
			});

			container.addEventListener("touchmove", ev => {
				switch (touchState.type) {
					case TOUCH_PAN: {
						const touch = ev.touches.item(0);
						tx = touchState.initialX + (touch.clientX - touchState.initialTouch.clientX) / scale;
						ty = touchState.initialY + (touch.clientY - touchState.initialTouch.clientY) / scale;
						applyTransformToCanvas();
						return;
					}
					case TOUCH_ZOOM: {
						const dist = getAvgTouchDist(ev.touches);
						if (dist === null) {
							return;
						}

						setScale(touchState.initialScale * (dist / touchState.initialDist));
						applyTransformToCanvas();
						return;
					}
				}
			});
		}

		function getAvgTouchDist(touches) {
			let px = null;
			let py = null;
			let tx = 0;
			let ty = 0;

			for (let i = 0, touch; touch = touches.item(i); i++) {
				if (px === null || py === null) {
					px = touch.clientX;
					py = touch.clientY;
				}

				tx += touch.clientX;
				ty += touch.clientY;
			}

			const l = touches.length;
			if (px === null || py === null || !l) {
				return null;
			}

			return Math.sqrt(Math.pow(px - tx / l, 2) + Math.pow(py - ty / l, 2));
		}

		function syncCursor() {
			const style = dragState === DRAG_IDLE ? "grab"
				: dragState === DRAG_DRAGGING ? "grabbing"
				: "auto";

			document.body.style.cursor = style;
		}

		const canvas = document.getElementById("__macana_jc_t");
		if (canvas) {
			if (vw > 0 && vh > 0) {
				const rect = canvas.getBoundingClientRect();

				setScale(Math.min(vw / rect.width, vh / rect.height));
			}

			canvas.style.position = "absolute";
			canvas.style.top = "50%";
			canvas.style.left = "50%";
		}

		function applyTransformToCanvas() {
			if (!canvas) {
				return;
			}

			canvas.style.transform = "translate(-50%, -50%)"
				+ \` scale(\${scale.toFixed(8)})\`
				+ \` translate(\${tx}px,\${ty}px)\`;
		}

		const controls = document.getElementById("__macana_jc_cs");
		if (controls) {
			controls.style.display = "";
		}

		const zoomInButton = document.getElementById("__macana_jc_in");
		if (zoomInButton) {
			zoomInButton.addEventListener("click", ev => {
				ev.preventDefault();
				setScale(scale + 0.1);
				applyTransformToCanvas();
			});
		}

		const zoomOutButton = document.getElementById("__macana_jc_out");
		if (zoomOutButton) {
			zoomOutButton.addEventListener("click", ev => {
				ev.preventDefault();
				setScale(scale - 0.1);
				applyTransformToCanvas();
			});
		}

		document.addEventListener("keydown", ev => {
			if (ev.key !== " ") {
				return;
			}
			ev.preventDefault();
			if (dragState === DRAG_NONE) {
				dragState = DRAG_IDLE;
				syncCursor();
			}
		}, { passive: false });

		document.addEventListener("keyup", ev => {
			if (ev.key !== " ") {
				return;
			}
			ev.preventDefault();
			if (dragState !== DRAG_NONE) {
				dragState = DRAG_NONE;
				syncCursor();
			}
		}, { passive: false });

		applyTransformToCanvas();
	}

	enchanceJSONCanvas();
`;

export interface JsonCanvasPageProps {
	context: Readonly<DocumentBuildContext>;

	content: JSONCanvas<Hast.Nodes>;
}

export function jsonCanvasPage(
	{ content, context }: JsonCanvasPageProps,
) {
	return h(null, [
		{ type: "doctype" },
		template({
			context,
			scripts: [layoutScript, documentTreeScript],
			inlineScripts: [ownScript],
			body: layout({
				fullscreen: true,
				nav: documentTree({ context }),
				footer: footer({ context }),
				main: (
					<div class={c.layout}>
						<div id="__macana_jc_c" class={c.canvas} tabindex="0">
							<div id="__macana_jc_t" class={c.padding}>
								{jsonCanvas({
									data: content,
									scrollClassName: c.scrollableChild,
								})}
							</div>
							<p class={c.keyShortcutTip}>
								Use arrow keys to move viewport, <kbd>-</kbd>{" "}
								key to zoom-out and <kbd>+</kbd> key to zoom-in.
							</p>
						</div>
						<div class={c.meta}>
							<h1 class={c.title}>{context.document.metadata.title}</h1>
							<div id="__macana_jc_cs" class={c.controls} style="display:none;">
								<button
									id="__macana_jc_out"
									class={c.controlButton}
									title="Zoom out"
								>
									{zoomOut()}
								</button>
								<span id="__macana_jc_scale" class={c.scale} aria-live="polite">
									100%
								</span>
								<button
									id="__macana_jc_in"
									class={c.controlButton}
									title="Zoom in"
								>
									{zoomIn()}
								</button>
							</div>
						</div>
					</div>
				),
				context,
			}),
		}),
	]);
}
