Obsidian's Markdown dialect is called Obsidian Flavored Markdown (OFM).
OFM is based on [[en/Features/Markdown/GitHub Flavored Markdown|GitHub Flavored Markdown (GFM)]], with additions and some deviations.

Unfortunately, Obsidian does not publish formal specification for OFM.
Due to the lack of specification, Macana's support for OFM is best-effort.

- [Basic formatting syntax - Obsidian Help](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax)
- [Advanced formatting syntax - Obsidian Help](https://help.obsidian.md/Editing+and+formatting/Advanced+formatting+syntax)
- [Obsidian Flavored Markdown - Obsidian Help](https://help.obsidian.md/Editing+and+formatting/Obsidian+Flavored+Markdown)

## Supported features

### Wikilinks

By default, Obsidian uses their own variant of [wikilink](https://en.wikipedia.org/wiki/Help:Link) for internal links.
To use this link style, surround the target file name without file extension or path to the file from the Vault root (document root) without file extension, with `[[` and `]]`.

- [Internal links - Obsidian Help](https://help.obsidian.md/Linking+notes+and+files/Internal+links)

```markdown
- [[Overview|Alternative Title]]
- [[Overview]]
- [[Overview#Arbitrary document tree]]
- [[GitHub Flavored Markdown#^alert-callout-compat]]
```

- [[Overview|Alternative Title]]
- [[Overview]]
- [[Overview#Arbitrary document tree]]
- [[GitHub Flavored Markdown#^alert-callout-compat]]

### Block identifier

Macana can generate corresponding anchor point if you create a block identifier.
Links to automatically generated block identifier is not supported.

- [Internal links - Obsidian Help](https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link+to+a+block+in+a+note)

```markdown
This is a paragraph. ^block-ident-demo
```

This is a paragraph. ^block-ident-demo

---

Since Macana strictly parse Markdown, block identifier separated by more than one newline characters is treated as a regular text, even though Obsidian treat that as a block identifier for the previous block.
Because of this, you can't reference the entire list.
This restriction may be removed if Obsidian published formal and correct specification for their Markdown flavor.

```markdown
- Foo
- Bar

^Baz
```

- Foo
- Bar

^Baz

### Image size attributes

Add a vertical pipe (`|`) following text specifying image dimensions to set the image size inside image's alt text.

- [Basic formatting syntax - Obsidian Help](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#External+images)

```markdown
![Engelbart|100x145](https://history-computer.com/ModernComputer/Basis/images/Engelbart.jpg)
```

![Engelbart|100x145](https://history-computer.com/ModernComputer/Basis/images/Engelbart.jpg)

### Embeds

You can embeds files in [accepted file formats](https://help.obsidian.md/Files+and+folders/Accepted+file+formats) by adding `!` right before the wikilink's opening square brackets.

- [Embed files - Obsidian Help](https://help.obsidian.md/Linking+notes+and+files/Embed+files)

#### Images

To set the display image size, add a vertical pipe (`|`) following text specifying image dimension.

- [Embed files - Obsidian Help](https://help.obsidian.md/Linking+notes+and+files/Embed+files#Embed+an+image+in+a+note)

```markdown
![[dog.jpg|128x128]]
```

![[dog.jpg|128x128]]

#### Another documents

Put an exclamation symbol `!` before internal wikilink to make it a document embeds.

- [Embed files - Obsidian Help](https://help.obsidian.md/Linking+notes+and+files/Embed+files#Embed+a+note+in+another+note)

As you can see in the below examples, Macana embeds the target document directly inside body without any modifications. The embedded section affects embedder's document outline. 
Place the embed inside blockquote if you want to it to be shown as quote.

```markdown
![[GitHub Flavored Markdown#Strikethrough]]
> ![[GitHub Flavored Markdown#Strikethrough]]
```

![[GitHub Flavored Markdown#Strikethrough]]

> ![[GitHub Flavored Markdown#Strikethrough]]
### Highlights

Surround text with `==` to make the text highlighted.

- [Basic formatting syntax - Obsidian Help](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#Bold,%20italics,%20highlights)

```markdown
==Hello, World!==
```

==Hello, World!==

### Callouts

- [Callouts - Obsidian Help](https://help.obsidian.md/Editing+and+formatting/Callouts)

```markdown
> [!info]+ Title, _Italic_
> Both title and body can contain Markdown.
```

> [!info]+ Title, _Italic_
> Both title and body can contain Markdown.

### Mathematical expressions

Macana supports mathematical expressions, both inline one (`$`) and block one (`$$`).

- [Advanced formatting syntax - Obsidian Help](https://help.obsidian.md/Editing+and+formatting/Advanced+formatting+syntax#Math)

Macana uses [Temml](https://temml.org/) while Obsidian uses [MathJax](https://docs.mathjax.org/en/latest/basic/mathjax.html), in order to support environments without JavaScript.
Possible differences including, but not limited to:

- Resulting graphics differs (Macana uses standard MathML, Obsidian uses MathJax's SVG output)
- Certain LaTeX macros available on Obsidian but not on Macana and vice versa.
- Rendering differences between User Agents due to rendering engines and/or available fonts.

```markdown
This is an inline math expression $e^{2i\pi} = 1$.
```

This is an inline math expression $e^{2i\pi} = 1$.

```markdown
$$
\begin{vmatrix}a & b\\
c & d
\end{vmatrix}=ad-bc
$$
```

$$
\begin{vmatrix}a & b\\
c & d
\end{vmatrix}=ad-bc
$$

### Comments

Surround portion of text with `%%` to exclude them from the output HTML.

- [Basic formatting syntax - Obsidian Help](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#Comments)

```markdown
Foo %%Bar%% Baz

%%
This entire block

should not be in the output HTML.
%%
```

Foo %%Bar%% Baz

%%
This entire block

should not be in the output HTML.
%%

## Unsupported features

### Nested callouts

For a technical reason, Macana currently cannot parse nested callouts.
This example is from Obsidian help document:

```markdown
> [!question] Can callouts be nested?
> > [!todo] Yes!, they can.
> > > [!example]  You can even use multiple layers of nesting.
```

> [!question] Can callouts be nested?
> > [!todo] Yes!, they can.
> > > [!example]  You can even use multiple layers of nesting.