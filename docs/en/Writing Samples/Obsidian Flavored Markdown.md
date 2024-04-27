---
createdAt: 2024-04-09T21:00:00+09:00
updatedAt: 2024-04-18T07:35:00+09:00
---

Obsidian Flavored Markdown (OFM) is an authoring format used in Obsidian, based on CommonMark and [[GitHub Flavored Markdown]] (GFM).
This page lists extensions not exists in both CommonMark and GFM.

- Brief description: https://help.obsidian.md/Editing+and+formatting/Obsidian+Flavored+Markdown
- Basic syntax list: https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax

Unfortunately, Obsidian does not publish a formal spec for the OFM.
Users should be aware Macana's OFM parser is not guaranteed to be 100% compatible with Obsidian's one, as the spec is not defined and even Obsidian behave inconsistent in some area.

## Wikilink extension

```markdown
- [[GitHub Flavored Markdown|GFM]]
- [[Overview]]
```

- [[GitHub Flavored Markdown|GFM]]
- [[Overview]]

Document embedding is not supported yet.

## Highlight extension

```markdown
==Hello, World!==
```

==Hello, World!==

## Callout extension

```markdown
> [!info]+ Title, [[GitHub Flavored Markdown]]
> Both title and body can contain Markdown.
```

> [!info]+ Title, [[GitHub Flavored Markdown]]
> Both title and body can contain Markdown.

## Image size attribute

OFM abuses image `alt` slot for size specifier.
You can inspect the `<img>` tags below to see how it affects the resulting markup.

```markdown
![Picture of my dog|64](../../Assets/dog.jpg)
![Picture of my dog|64x32](../../Assets/dog.jpg)
![Picture of my dog|128x128](../../Assets/dog.jpg)
![[dog.jpg|64]]
```

![Picture of my dog|64](../../Assets/dog.jpg)
![Picture of my dog|64x32](../../Assets/dog.jpg)
![Picture of my dog|128x128](../../Assets/dog.jpg)
![[dog.jpg|64]]

## Math extension (LaTeX)

Macana parses math notations using [Temml](https://temml.org/). It converts LaTeX notation to MathML, which browsers natively support without JavaScript.

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