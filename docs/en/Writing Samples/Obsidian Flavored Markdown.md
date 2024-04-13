Obsidian Flavored Markdown (OFM) is an authoring format used in Obsidian, based on CommonMark and [[GitHub Flavored Markdown]] (GFM).
This page lists extensions not exists in both CommonMark and GFM.

- Brief description: https://help.obsidian.md/Editing+and+formatting/Obsidian+Flavored+Markdown
- Basic syntax list: https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax

Unfortunately, Obsidian does not publish a formal spec for the OFM.
Users should be aware Macana's OFM parser is not guaranteed to be 100% compatible with Obsidian's one, as the spec is not defined and even Obsidian behave inconsistent in some area.

## Highlight extension

```markdown
==Hello, World!==
```

==Hello, World!==

## Image size attribute

OFM abuses image `alt` slot for size specifier.
You can inspect the `<img>` tags below to see how it affects the resulting markup.

```markdown
![Picture of my dog|64](../../Assets/dog.jpg)
![Picture of my dog|64x32](../../Assets/dog.jpg)
![Picture of my dog|128x128](../../Assets/dog.jpg)
```

![Picture of my dog|64](../../Assets/dog.jpg)
![Picture of my dog|64x32](../../Assets/dog.jpg)
![Picture of my dog|128x128](../../Assets/dog.jpg)