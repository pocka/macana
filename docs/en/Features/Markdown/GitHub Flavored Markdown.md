Obsidian's Markdown dialect, called [[en/Features/Markdown/Obsidian Flavored Markdown|Obsidian Flavored Markdown (OFM)]], is based on another dialect called GitHub Flavored Markdown (GFM).
GFM is based on CommonMark, and has additional syntax extension and undocumented widgets that abuses existing Markdown syntax.

- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)

## Supported features

### Strikethrough

Surround text with a pair of one or two tildes (`~`) to make the part strikethrough.

- [Specification](https://github.github.com/gfm/#strikethrough-extension-)

```markdown
~~This text is rendered with strikethrough~~.
```

~~This text is rendered with strikethrough~~.

### Task list items

Add `[ ]` (unchecked) or `[x]` (checked) before a list item to make it task list item.

- [Specification](https://github.github.com/gfm/#task-list-items-extension-)

```markdown
- [x] Checked
- [ ] Unchecked
- Normal item
	- Normal item
	- [x] Nested task item
```

- [x] Checked
- [ ] Unchecked
- Normal item
	- Normal item
	- [x] Nested task item

### Footnotes

This feature is not officially documented at the specification.

- [Footnotes now supported in Markdown fields - The GitHub Blog](https://github.blog/changelog/2021-09-30-footnotes-now-supported-in-markdown-fields/)
- [Basic writing and formatting syntax - GitHub Docs](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#footnotes)

```markdown
This is a normal paragraph[^1].

[^1]: I'm not.
```

This is a normal paragraph[^1].

[^1]: I'm not.

### Autolinks

Parser treats URL-ish text as a link.

- [Specification](https://github.github.com/gfm/#autolinks-extension-)

```markdown
https://github.github.com/gfm/
```

https://github.github.com/gfm/

### Tables

- [Specification](https://github.github.com/gfm/#tables-extension-)

```markdown
|  Language  | Execution         |
| :--------: | ----------------- |
| JavaScript | Interpreter & JIT |
```

|  Language  | Execution         |
| :--------: | ----------------- |
| JavaScript | Interpreter & JIT |
|    Dart    | AOT or JIT        |

## Unsupported features

### Alerts

This feature is not officially documented at the specification.

- [Basic writing and formatting syntax - GitHub Docs](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts)

Syntax-wise, a valid GFM Alert is a valid OFM Callout: <math><mi>Alert</mi><mo>⊂</mo><mi>Callout</mi></math>.
However, the `CAUTION` type will be rendered as same variant as `WARNING` type, as shown below.

```markdown
> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.
```

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.

### MermaidJS diagrams

This feature is not officially documented at the specification.

- [Creating diagrams - GitHub Docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)

Due to the library neither be able to output without headless Chrome/Chromium nor exposes syntax parser, Macana does not support for this feature currently.

### Mathematical expressions

This feature is not officially documented at the specification.

- [Writing mathematical expressions - GitHub Docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions)

OFM defines [its own syntax for mathematical expressions](https://help.obsidian.md/Editing+and+formatting/Advanced+formatting+syntax#Math).
While both OFM and GFM use dollar sign as a marker, GFM also supports an alternative syntax for inline mathematical expression:

```markdown
Answer is $`x = 5`$.
```

Macana does not support this alternative syntax.