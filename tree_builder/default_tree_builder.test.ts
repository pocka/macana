// SPDX-FileCopyrightText: 2024 Shota FUJI <pockawoooh@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
	assertEquals,
	assertNotEquals,
	assertObjectMatch,
} from "../deps/deno.land/std/assert/mod.ts";

import { MemoryFsReader } from "../filesystem_reader/memory_fs.ts";
import { noopParser } from "../content_parser/noop.ts";
import {
	DefaultTreeBuilder,
	fileExtensions,
	ignore,
	ignoreDotfiles,
	langDir,
	removeExtFromMetadata,
} from "./default_tree_builder.ts";

const contentParser = noopParser;

Deno.test("Should read from top-level directory, as-is", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "Foo Bar/Baz Qux.md", content: "" },
		{ path: "Foo.md", content: "" },
	]);
	const builder = new DefaultTreeBuilder({ defaultLanguage: "en" });

	const tree = await builder.build({
		fileSystemReader,
		contentParser,
	});

	assertObjectMatch(tree.nodes[0], {
		metadata: {
			name: "Foo Bar",
			title: "Foo Bar",
		},
		directory: {
			name: "Foo Bar",
		},
		entries: [
			{
				metadata: {
					name: "Baz Qux.md",
					title: "Baz Qux.md",
				},
				file: {
					name: "Baz Qux.md",
				},
			},
		],
	});

	assertObjectMatch(tree.nodes[1], {
		metadata: {
			name: "Foo.md",
			title: "Foo.md",
		},
		file: {
			name: "Foo.md",
		},
	});
});

Deno.test("Should respect metadata returned by Content Parser", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "Foo.md", content: "" },
	]);
	const builder = new DefaultTreeBuilder({ defaultLanguage: "en" });

	const tree = await builder.build({
		fileSystemReader,
		contentParser: {
			async parse() {
				return {
					documentContent: {
						kind: "null",
						content: null,
					},
					documentMetadata: {
						title: "Brown fox",
						name: "jumps over",
						language: "lazy-dog",
					},
				};
			},
		},
	});

	assertObjectMatch(tree.nodes[0], {
		metadata: {
			title: "Brown fox",
			name: "jumps over",
			language: "lazy-dog",
		},
		file: {
			name: "Foo.md",
		},
	});
});

Deno.test("Should sort by default", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "a/b.md", content: "" },
		{ path: "b.md", content: "" },
		{ path: "a/a.md", content: "" },
	]);
	const builder = new DefaultTreeBuilder({ defaultLanguage: "en" });

	const tree = await builder.build({
		fileSystemReader,
		contentParser,
	});

	assertObjectMatch(tree, {
		nodes: [
			{
				metadata: { title: "a" },
				entries: [
					{
						metadata: { title: "a.md" },
					},
					{
						metadata: { title: "b.md" },
					},
				],
			},
			{
				metadata: { title: "b.md" },
			},
		],
	});
});

Deno.test("Should accept custom sorter", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "a/b.md", content: "" },
		{ path: "b.md", content: "" },
		{ path: "a/a.md", content: "" },
	]);
	const builder = new DefaultTreeBuilder({
		defaultLanguage: "en",
		sorter(a, b) {
			return b.metadata.title.localeCompare(a.metadata.title, "en");
		},
	});

	const tree = await builder.build({
		fileSystemReader,
		contentParser,
	});

	assertObjectMatch(tree, {
		nodes: [
			{
				metadata: { title: "b.md" },
			},
			{
				metadata: { title: "a" },
				entries: [
					{
						metadata: { title: "b.md" },
					},
					{
						metadata: { title: "a.md" },
					},
				],
			},
		],
	});
});

Deno.test("ignore() and ignoreDotfiles() should ignore files and directories", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "foo/bar/baz.md", content: "" },
		{ path: "foo/bar.md", content: "" },
		{ path: "foo.md", content: "" },
		{ path: "bar/foo.md", content: "" },
		{ path: "bar/foo/baz.md", content: "" },
		{ path: ".baz.md", content: "" },
	]);
	const builder = new DefaultTreeBuilder({
		defaultLanguage: "en",
		strategies: [ignore((node) => node.name === "foo"), ignoreDotfiles()],
	});

	const tree = await builder.build({
		fileSystemReader,
		contentParser,
	});

	assertEquals(tree.nodes.length, 2);

	assertObjectMatch(tree.nodes[0], {
		metadata: {
			name: "bar",
			title: "bar",
		},
		directory: {
			name: "bar",
		},
		entries: [
			{
				metadata: {
					name: "foo.md",
					title: "foo.md",
				},
				file: {
					name: "foo.md",
				},
			},
		],
	});

	assertObjectMatch(tree.nodes[1], {
		metadata: {
			name: "foo.md",
			title: "foo.md",
		},
		file: { name: "foo.md" },
	});
});

Deno.test("fileExtensions() should ignore files not matching the extension list", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "foo.md", content: "" },
		{ path: "bar.txt", content: "" },
		{ path: "baz.html", content: "" },
		{ path: "qux.canvas", content: "" },
		{ path: "quux.jpeg", content: "" },
	]);
	const builder = new DefaultTreeBuilder({
		defaultLanguage: "en",
		strategies: [fileExtensions([".md", ".canvas"])],
	});

	const tree = await builder.build({
		fileSystemReader,
		contentParser,
	});

	assertEquals(tree.nodes.length, 2);

	assertObjectMatch(tree.nodes[0], {
		metadata: {
			name: "foo.md",
			title: "foo.md",
		},
		file: { name: "foo.md" },
	});

	assertObjectMatch(tree.nodes[1], {
		metadata: {
			name: "qux.canvas",
			title: "qux.canvas",
		},
		file: { name: "qux.canvas" },
	});
});

Deno.test("langDir() should treat directories matching to the record as lang directory", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "en.md", content: "" },
		{ path: "en/foo.md", content: "" },
		{ path: "ja/foo.md", content: "" },
	]);
	const builder = new DefaultTreeBuilder({
		defaultLanguage: "en",
		strategies: [langDir({ en: "English", ja: "日本語" })],
	});

	const tree = await builder.build({
		fileSystemReader,
		contentParser,
	});

	assertObjectMatch(tree.nodes[0], {
		metadata: {
			name: "en.md",
			title: "en.md",
		},
		file: { name: "en.md" },
	});

	assertNotEquals(tree.nodes[0].metadata.language, "en");

	assertObjectMatch(tree.nodes[1], {
		metadata: {
			name: "en",
			title: "English",
			language: "en",
		},
		directory: {
			name: "en",
		},
		entries: [
			{
				metadata: {
					name: "foo.md",
					title: "foo.md",
				},
				file: { name: "foo.md" },
			},
		],
	});

	assertObjectMatch(tree.nodes[2], {
		metadata: {
			name: "ja",
			title: "日本語",
			language: "ja",
		},
		directory: {
			name: "ja",
		},
		entries: [
			{
				metadata: {
					name: "foo.md",
					title: "foo.md",
				},
				file: { name: "foo.md" },
			},
		],
	});
});

Deno.test("removeExtFromMetadata() should remove file extension from document metadata", async () => {
	const fileSystemReader = new MemoryFsReader([
		{ path: "Foo/Bar.secret/Baz.md", content: "" },
	]);
	const builder = new DefaultTreeBuilder({
		defaultLanguage: "en",
		strategies: [removeExtFromMetadata()],
	});

	const tree = await builder.build({
		fileSystemReader,
		contentParser,
	});

	assertObjectMatch(tree.nodes[0], {
		metadata: {
			name: "Foo",
			title: "Foo",
		},
		directory: { name: "Foo" },
		entries: [
			{
				metadata: {
					name: "Bar.secret",
					title: "Bar.secret",
				},
				directory: { name: "Bar.secret" },
				entries: [
					{
						metadata: {
							name: "Baz",
							title: "Baz",
						},
						file: { name: "Baz.md" },
					},
				],
			},
		],
	});
});
