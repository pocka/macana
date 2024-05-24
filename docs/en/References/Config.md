## Input options

### `input.path`

- Type: `string` (file path)
- CLI: First positional argument
- Required

Path to a Vault (source directory includes documents).
Path needs to be relative and resolved from the config file.

## Output options

### `output.path`

- Type: `string` (file path)
- CLI: `--out <PATH>` option
- Required

Path to the output directory.
Path needs to be relative and resolved from the config file.

### `output.precompress`

- Type: `boolean`
- CLI: `--precompress` flag

Whether to compress `.html`, `.css` and `.js` files into `.<ext>.gz`, `.<ext>.br` and `.<ext>.zst` files.
For example, if an output directory contains `index.html`, Macana also generates
- `index.html.gz` (Gzip)
- `index.html.br` (Brotli)
- `index.html.zst` (ZStandard)

inside the same directory.

## Website metadata options

### `metadata.name`

- Type: `string`
- CLI: `--name <TEXT>` option
- Required

Website name, title.
`<title>` and a title section in a header uses this text.

### `metadata.favicon.svg`

- Type: `string` (file path)
- CLI: `--favicon-svg <PATH>` option

Path to a SVG file to use as a favicon.
Path needs to be relative and resolved from the config file.

### `metadata.favicon.png`

- Type: `string` (file path)
- CLI: `--favicon-png <PATH>` option

Path to a PNG file to use as a favicon.
Path needs to be relative and resolved from the config file.

### `metadata.copyright`

- Type: `string`
- CLI: `--copyright <TEXT>` option
- Required

Copyright text to show in the generated website.

### `metadata.logoImage`

- Type: `string` (file path)
- CLI: `--logo-image <PATH>` option

Path to an image file to use as a website logo.
Path needs to be relative and resolved from the config file.

## Document options
### `documents.defaultLanguage`

- Type: `string`
- CLI: `--lang <TEXT>` option
- Default: `"en"`

Default language for the generated website.

### `documents.languages.<directory>`

- Type: `{ title: string; lang: string }`

If a directory name matches to `<directory>`, the directory is treated as a language directory: the directory itself and its contents have different language than the parent one.

### `documents.resolveShortestPathWhenPossible`

- Type: `boolean`
- CLI: `--shortest-path-when-possible` flag

Enable support for Obsidian's "[[Ambiguous path resolution#Shortest path when possible|Shortest path when possible]]" link resolution.

### `documents.title.keepExtension`

- Type: `boolean`
- CLI: `--keep-ext` flag

By default, Macana use filename without file extension part as a document title.
If this option is enabled, Macana does not trim the file extension part.

## Markdown options

### `markdown.enabled`

- Type: `boolean`
- Default: `true`

Enable parsing of Markdown documents.
You can disable this from CLI via `--disable-markdown` flag.

### `markdown.yamlFrontmatter`

- Type: `boolean`
- CLI: `--markdown-frontmatter` flag

Enable parsing of YAML frontmatter in Markdown documents.

## JSONCanvas options

### `jsonCanvas.enabled`

- Type: `boolean`
- Default: `true`

Enable parsing of JSONCanvas documents.
You can disable this from CLI via `--disable-jsoncanvas` flag.