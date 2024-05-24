Macana is initially designed as a TypeScript module for Deno.
While this is tedious, you can tweak more options compared to the [CLI usage](./CLI).

## System requirements

In order to build your Vault with Macana as a Deno module, you need [Deno](https://deno.com/) on your system.

Macana is developed and tested on Deno v1.41.
Earlier versions of Deno runtime may not be compatible with Macana. 

## The build script

### Overview

The most simple build script this document shows as a demonstration, will do:

1. Create file system reader / writer
2. Create content parser for Markdown and JSONCanvas
3. Scan and Parse documents inside Vault
4. Build and Write HTML files and asset files

Here is the final form.
Read the following sections if you're not sure what these lines are doing.

```ts
// build.ts
import { DenoFsReader } from "https://deno.land/x/macana@v0.1.1/filesystem_reader/deno_fs.ts";
import { DenoFsWriter } from "https://deno.land/x/macana@v0.1.1/filesystem_writer/deno_fs.ts";
import {
	DefaultTreeBuilder,
	fileExtensions,
	ignoreDotfiles,
	removeExtFromMetadata,
	defaultDocumentAt,
} from "https://deno.land/x/macana@v0.1.1/tree_builder/default_tree_builder.ts";
import { ObsidianMarkdownParser } from "https://deno.land/x/macana@v0.1.1/content_parser/obsidian_markdown.ts";
import { JSONCanvasParser } from "https://deno.land/x/macana@v0.1.1/content_parser/json_canvas.ts";
import { oneof } from "https://deno.land/x/macana@v0.1.1/content_parser/oneof.ts";
import { DefaultThemeBuilder } from "https://deno.land/x/macana@v0.1.1/page_builder/default_theme/mod.ts";

const fileSystemReader = new DenoFsReader(new URL("./contents", import.meta.url));

const fileSystemWriter = new DenoFsWriter(new URL("./.dist", import.meta.url));

const treeBuilder = new DefaultTreeBuilder({
	defaultLanguage: "en",
	ignore: [ignoreDotfiles],
	strategies: [
		fileExtensions([".md", ".canvas"]),
		removeExtFromMetadata(),
		defaultDocumentAt(["About", "Author.md"]),
	],
	resolveShortestPathWhenPossible: true,
});

const documentTree = await treeBuilder.build({
	fileSystemReader,
	contentParser: oneof(
		new JSONCanvasParser(),
		new ObsidianMarkdownParser({
			frontmatter: true,
		}),
	),
})

const pageBuilder = new DefaultThemeBuilder({
	siteName: "<YOUR WEBSITE TITLE>",
	copyright: "<COPYRIGHT TEXT>",
	faviconSvg: ["Assets", "favicon.svg"],
	faviconPng: ["Assets", "favicon.png"],
	siteLogo: ["Assets", "logo.png"],
})

await pageBuilder.build({
	documentTree,
	fileSystemReader,
	fileSystemWriter,
})
```

> [!tip]- Sample build script with explanation
> If you prefer code instead of paragraphs...
> 
> ```ts
> import { DenoFsReader } from "https://deno.land/x/macana@v0.1.1/filesystem_reader/deno_fs.ts";
> import { DenoFsWriter } from "https://deno.land/x/macana@v0.1.1/filesystem_writer/deno_fs.ts";
> import {
> 	DefaultTreeBuilder,
> 	fileExtensions,
> 	ignoreDotfiles,
> 	removeExtFromMetadata,
> 	defaultDocumentAt,
> } from "https://deno.land/x/macana@v0.1.1/tree_builder/default_tree_builder.ts";
> import { ObsidianMarkdownParser } from "https://deno.land/x/macana@v0.1.1/content_parser/obsidian_markdown.ts";
> import { JSONCanvasParser } from "https://deno.land/x/macana@v0.1.1/content_parser/json_canvas.ts";
> import { oneof } from "https://deno.land/x/macana@v0.1.1/content_parser/oneof.ts";
> import { DefaultThemeBuilder } from "https://deno.land/x/macana@v0.1.1/page_builder/default_theme/mod.ts";
> 
> // Treat `contents/` directory as a Vault.
> // By resolving from `import.meta.url`, `contents/` directory next to this
> // build script will be used regardless of cwd. If you want it to resolve
> // from cwd, simply pass string like `new DenoFsReader("./contents")`.
> const fileSystemReader = new DenoFsReader(new URL("./contents", import.meta.url));
> 
> // Write output files inside "./dist" directory.
> const fileSystemWriter = new DenoFsWriter(new URL("./.dist", import.meta.url));
> 
> const treeBuilder = new DefaultTreeBuilder({
> 	// Of course, this depends on your contents.
> 	defaultLanguage: "en",
> 	// Ignoring dotfiles.
> 	// You can also pass custom function to filter out certain files/directories.
> 	ignore: [ignoreDotfiles],
> 	// This customize scanning and building tree behavior.
> 	strategies: [
> 		// Do not handle files whose extension is neither of ".md" or ".canvas".
> 		// This function only affects to "whether this file is in document tree":
> 		// files excluded by this function can still be included as an asset.
> 		fileExtensions([".md", ".canvas"]),
> 
> 		// By default, Macana uses filename as a title.
> 		// This function removes file extension part from the title.
> 		// For example, "About me.md" becomes "About me".
> 		removeExtFromMetadata(),
> 
> 		// This explicitly tells Macana to use "./contents/About/Author.md"
> 		// as the default document (link destination of site logo link, and
> 		// redirect location for website root). Without this, Macana uses
> 		// the first document found in the Vault as the default document.
> 		defaultDocumentAt(["About", "Author.md"]),
> 	],
> 	// Enables "Shortest path when possible" path resolution.
> 	// This is disabled by default for performance reasons.
> 	// If you are not using this resolution in your Vault, you can turn off this.
> 	resolveShortestPathWhenPossible: true,
> });
> 
> // This is your Vault as a tree of parsed documents.
> const documentTree = await treeBuilder.build({
> 	fileSystemReader,
> 	contentParser: oneof(
> 		new JSONCanvasParser(),
> 		// If you want to support both JSONCanvas and Markdown, you **need** to
> 		// put the markdown parser at the last. Content parsers does not read
> 		// file extension: instead they tries to parse the file content and
> 		// abort if the content is not expected document. The problem is,
> 		// Markdown is so permissive that any plain text can be Markdown.
> 		// If you put Markdown parser at the first, it successuflly parses
> 		// every file and later parsers does not have a chance to parse.
> 		new ObsidianMarkdownParser({
> 			// Optionally load metadata from YAML frontmatter.
> 			frontmatter: true,
> 		}),
> 	),
> })
> 
> // This class converts the `documentTree` into HTML files.
> const pageBuilder = new DefaultThemeBuilder({
> 	// Can be anything, but long name may break layout
> 	siteName: "[YOUR WEBSITE TITLE]",
> 
> 	// Common one is "Copyright [year] [your name]"
> 	copyright: "[COPYRIGHT TEXT]",
> 
> 	// [OPTIONAL]
> 	// If you have SVG favicon. In this case, Macana reads
> 	// "./contents/Assets/favicon.svg" and copies it to the output directory.
> 	faviconSvg: ["Assets", "favicon.svg"],
> 
> 	// [OPTIONAL]
> 	// If you have PNG favicon. In this case, Macana reads
> 	// "./contents/Assets/favicon.png" and copies it to the output directory.
> 	faviconPng: ["Assets", "favicon.png"],
> 
> 	// [OPTIONAL]
> 	// Website logo image. In this case, Macana reads
> 	// "./contents/Assets/logo.png" and copies it to the output directory.
> 	// You can any image format as long as browsers can display it.
> 	siteLogo: ["Assets", "logo.png"],
> })
> 
> // Generate website from `documentTree` then writes via `fileSystemWriter`.
> await pageBuilder.build({
> 	documentTree,
> 	// Page builder needs access to reader for copying asset.
> 	fileSystemReader,
> 	fileSystemWriter,
> })
> 
> // Now, your website is built at "./.dist" directory.
> ```


### FileSystem Reader

Macana uses abstraction layer for file I/O.
FileSystem Reader provides listing directory and reading file contents capability.

```ts
import { DenoFsReader } from "https://deno.land/x/macana@v0.1.1/filesystem_reader/deno_fs.ts";

const fileSystemReader = new DenoFsReader(new URL("./contents", import.meta.url));

// ---

// = ./contents
const root = await fileSystemReader.getRootDirectory();

// = entries of ./contents
const entries = await root.read();
```

`DenoFsReader`, which uses Deno's native file system I/O, restricts access to the given root directory (constructor parameter).
Thanks to this, you can safely limit the scope of `read` permission to the reader's root directory (constructor parameter).

```
$ deno run --allow-read=contents build.ts
```

### FileSystem Writer

FileSystem Writer provides capability to write to files and create directories.

```ts
import { DenoFsWriter } from "https://deno.land/x/macana@v0.1.1/filesystem_writer/deno_fs.ts";

const fileSystemWriter = new DenoFsWriter(new URL("./.dist", import.meta.url));

// ---

const text = new TextEncoder().encode("Hello, World!\n");

await fileSystemWriter.write(["foo", "bar.txt"], text);

// .dist/foo/bar.txt with content "Hello, World!" created.
```

As with `DenoFsReader`, `DenoFsWriter` restricts file I/O scope too.
You can limit the scope of `write` permission to the writer's root directory (constructor parameter).

```
$ deno run --allow-write=.dist build.ts
```

Macana exports some useful function to wrap the FileSystem Writer for additional functionality.

#### Precompress

`precompress` function adds precompress functionality to the FileSystem Writer.
The resulted file formats are compatible with [Caddy](https://caddyserver.com/)'s [`precompressed`](https://caddyserver.com/docs/caddyfile/directives/file_server#syntax) directive.

```ts
import { DenoFsWriter } from "https://deno.land/x/macana@v0.1.1/filesystem_writer/deno_fs.ts";
import { precompress } from "https://deno.land/x/macana@v0.1.1/filesystem_writer/precompress.ts";

const fileSystemWriter = precompress()(
	new DenoFsWriter(new URL("./.dist", import.meta.url))
);

// ---

const text = new TextEncoder().encode(`console.log("Hello, World!");`);

// fileSystemWriter writes:
// ./.dist/index.js
// ./.dist/index.js.br
// ./.dist/index.js.gz
// ./.dist/index.js.zst
await fileSystemWriter.write(["index.js"], text);
```

#### Overwrite prevention

`noOverwrite` function skips redundant write to the same file.
In addition to that, if it detects the writes to different content to the same file, it aborts the build in order to prevent producing inconsistent build output.

```ts
import { DenoFsWriter } from "https://deno.land/x/macana@v0.1.1/filesystem_writer/deno_fs.ts";
import { noOverwrite } from "https://deno.land/x/macana@v0.1.1/filesystem_writer/no_overwrite.ts";

const fileSystemWriter = noOverwrite(
	new DenoFsWriter(new URL("./.dist", import.meta.url))
);

// ---

const text = new TextEncoder().encode(`console.log("Hello, World!");`);

await fileSystemWriter.write(["index.js"], text); // This performs file I/O
await fileSystemWriter.write(["index.js"], text); // This does not
```

For performance reasons, you should use this function.

### Tree Builder

Tree Builder is responsible for scanning Vault files and directories, and building a document tree.
This has the most tuning knob, because Obsidian uses no convention on directory structure: what to include or exclude, how to manage multi language documents, whether the title should include file extension... the possibility of choices and preferences is too large.

In order not to constrain too much on what you can do, Macana does very little by default.
Uses filename as a title as-is, first found document as a default document, tries to parse every file as a document, etc.

```ts
import { DefaultTreeBuilder } from "https://deno.land/x/macana@v0.1.1/tree_builder/default_tree_builder.ts";
import { ObsidianMarkdownParser } from "https://deno.land/x/macana@v0.1.1/content_parser/obsidian_markdown.ts";
import { JSONCanvasParser } from "https://deno.land/x/macana@v0.1.1/content_parser/json_canvas.ts";
import { oneof } from "https://deno.land/x/macana@v0.1.1/content_parser/oneof.ts";

// This works, but you may (probably) want to tune it further
const treeBuilder = new DefaultTreeBuilder({
	defaultLanguage: "en",
});

const documentTree = await treeBuilder.build({
	fileSystemReader,
	contentParser: oneof(
		new JSONCanvasParser(),
		new ObsidianMarkdownParser({
			frontmatter: true,
		}),
	),
})
```

Users modify and restrict this permissive behavior by **strategies**.
Strategy is a function that takes a file or a directory then tells the Tree Builder to skip the file or returns metadata.

```ts
import {
	// Restrict which files to be treated as a document, based on extension
	fileExtensions,
	// Remove file extension part from metadata
	removeExtFromMetadata,
	// Explicitly tell which document is the default document
	defaultDocumentAt,
	// Treat certain directories as language directory - for multi language Vault
	langDir,
	// Use file timestamps as creation/update date
	// (does not work with Git, though)
	useFileSystemTimestamps,
} from "https://deno.land/x/macana@v0.1.1/tree_builder/default_tree_builder.ts";

const treeBuilder = new DefaultTreeBuilder({
	defaultLanguage: "en",
	strategies: [
		fileExtensions([".md"]),
		// ...
	],
})

const documentTree = await treeBuilder.build({
	// ...
})
```

### Page Builder

Page Builder builds HTML and other assets from a document tree.
If you don't like how Macana's default theme builder works, write your own.

```ts
import { DefaultThemeBuilder } from "https://deno.land/x/macana@v0.1.1/page_builder/default_theme/mod.ts";

const pageBuilder = new DefaultThemeBuilder({
	siteName: "<YOUR WEBSITE TITLE>",
	copyright: "<COPYRIGHT TEXT>",
	faviconSvg: ["Assets", "favicon.svg"],
	faviconPng: ["Assets", "favicon.png"],
	siteLogo: ["Assets", "logo.png"],
})

await pageBuilder.build({
	documentTree,
	fileSystemReader,
	fileSystemWriter,
})
```

While this document throughly uses `Assets/` as the directory for assets, you can use whatever you want: you can even place your asset files at the top level of your Vault directory.
However, **every assets needs to be inside the Vault directory**.
Otherwise FileSystem Reader cannot access to the files.

## Running the script

Since all of these are plain simple JavaScript / TypeScript, you can simply run `deno run` with minimum permission flags.

```
$ deno run --allow-read=<YOUR VAULT> --allow-write=<OUTPUT DIR> build.ts
```

If you do not want to type this lengthy command every time you build, define it as a Deno task.

```jsonc
// deno.jsonc
{
  "tasks": {
    "build": "deno run --allow-read=<YOUR VAULT> --allow-write=<OUTPUT DIR> build.ts"
  }
}
```
