This document describes guides for developers editing or testing Macana codebase.

## Required tools

In order to run or test Macana application, you need the following tools:

- Deno v1.41

Use of tools supporting reading of `.tool-versions` file is highly recommended.

## Copyright headers

This project aims to be compliant with license [REUSE](https://reuse.software/) framework.

For files that can have code comments, place a [copyright comment header](https://reuse.software/spec/#comment-headers) at the topmost in the file.
If a file cannot contain code comments (e.g. binary file, JSON file), use `*.license` file approach described in the [copyright comment header](https://reuse.software/spec/#comment-headers) section.

Exception to this rule is files under `docs/` directory: copyright and license of those files are batch-described in the `.reuse/dep5` file.
See more about DEP5 file [here](https://reuse.software/spec/#dep5).

## Charsets, Line endings, Indents

This project has `.editorconfig` file.
Use text editor or editor plugin that supports EditorConfig.

## Filename convention

Files and directories under `docs/` should have its title as a file/directory name, so it can be edited as a regular Obsidian Vault.
- Good
	- `docs/Overview.md`
	- `docs/How to use/CLI.md`
- Bad
	- `docs/overview.md`
	- `docs/how-to-use/CLI.md`

Having files or directories whose names are same except casing are prohibited.
- Bad
	- Having both `docs/CLI.md` and `docs/cli.md`

Other than that, use `snake_case` for file/directory names.

## Formatting code

Run this command on the repository root:

```
$ deno fmt
```

## Running unit tests

The most straightforward way to run the tests is to run this command on the repository root:

```
$ deno test --allow-read=. --allow-write=./filesystem_writer/.test
```

- If you omit the `--allow-read=.` permission, tests performing actual file I/O will be skipped.
- If you omit the `--allow-write=./filesystem_writer/.test` permission, tests performing actual file write will be skipped.