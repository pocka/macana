// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export type { FileSystemReader } from "./internal/filesystem_reader/interface.ts";
export { DenoFsReader } from "./internal/filesystem_reader/deno_fs.ts";
export { MemoryFsReader } from "./internal/filesystem_reader/memory_fs.ts";

export type { FileSystemWriter } from "./internal/filesystem_writer/interface.ts";
export { DenoFsWriter } from "./internal/filesystem_writer/deno_fs.ts";
export { MemoryFsWriter } from "./internal/filesystem_writer/memory_fs.ts";
export { precompress } from "./internal/filesystem_writer/precompress.ts";
export { noOverwrite } from "./internal/filesystem_writer/no_overwrite.ts";
export { validateTree } from "./internal/filesystem_writer/validate_tree.ts";

export type {
	ContentParser,
	ContentParseResult,
} from "./internal/content_parser/interface.ts";
export { oneof } from "./internal/content_parser/oneof.ts";
export { ObsidianMarkdownParser } from "./internal/content_parser/obsidian_markdown.ts";
export type {
	ObsidianMarkdownDocument,
	ObsidianMarkdownParserOptions,
} from "./internal/content_parser/obsidian_markdown.ts";
export {
	InvalidJSONCanvasError,
	InvalidJSONError,
	JSONCanvasParseError,
	JSONCanvasParser,
} from "./internal/content_parser/json_canvas.ts";
export type { JSONCanvasDocument } from "./internal/content_parser/json_canvas.ts";

export type { TreeBuilder } from "./internal/tree_builder/interface.ts";
export {
	defaultDocumentAt,
	DefaultTreeBuilder,
	fileExtensions,
	ignoreDotfiles,
	langDir,
	removeExtFromMetadata,
} from "./internal/tree_builder/default_tree_builder.ts";
export type {
	DefaultTreeBuilderConfig,
	IgnoreFunction,
	TreeBuildStrategy,
	TreeBuildStrategyFunctionReturns,
} from "./internal/tree_builder/default_tree_builder.ts";

export type {
	BuildParameters,
	PageBuilder,
} from "./internal/page_builder/interface.ts";
export { DefaultThemeBuilder } from "./internal/page_builder/default_theme/mod.ts";
export type { DefaultThemeBuilderConstructorParameters } from "./internal/page_builder/default_theme/mod.ts";
