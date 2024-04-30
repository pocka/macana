Macana uses [micromark](https://github.com/micromark/micromark) and [mdast](https://github.com/syntax-tree/mdast) utilities for basic Markdown parsing.
Those libraries are based on [CommonMark](https://commonmark.org/), a de-facto standard of Markdown syntax.
Because of that, you can expect Macana to correctly render CommonMark syntax otherwise overridden by extensions.

- [CommonMark Spec](https://spec.commonmark.org/0.31.2/) (v0.31.2)

As the number of syntax element is large, this page only lists additional behavior and restrictions performed by Macana.

## Heading levels

Since Macana uses a file name or `title` YAML frontmatter field for `<h1>`, you should avoid using level 1 heading in your Markdown files.

> [!info]
> There is a plan for adding an option to down-level headings in a future.
> See [[Roadmap]] for more info.

## Syntax highlighting

Add language name as a first word of [info string](https://spec.commonmark.org/0.31.2/#info-string) for a [fenced code block](https://spec.commonmark.org/0.31.2/#fenced-code-blocks) to add syntax highlighting to the code block.
Macana uses [refractor](https://github.com/wooorm/refractor) as a syntax highlight engine.

> [!info]
> Style customization is not supported yet.

~~~markdown
Snippet from JSONCanvas renderer.

```tsx
function textNode({ node }: TextNodeProps) {
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
				class={c.embed}
			>
				{node.text}
			</div>
		</foreignObject>
	);
}
```
~~~

Snippet from JSONCanvas renderer.

```tsx
function textNode({ node }: TextNodeProps) {
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
				class={c.embed}
			>
				{node.text}
			</div>
		</foreignObject>
	);
}
```