In addition to the normal internal path such as,

```
[Foo](./Foo.md)
```

Obsidian resolves ambiguous path notations too.
This page lists ambiguous path notations Macana supports.

Macana uses these path resolutions for:

- Regular Markdown links (`[label](url)`)
- Wikilinks (`[[internal link]]`)
- Regular Markdown images (`![alt](url)`)
- Wikilink embeds (`![[internal link]]`)

## List of supported ambiguous path resolutions
### Relative path without file extension

You can omit the file extension part from the relative path.
However, this would negatively affects build performance due to additional I/O for lookup.

```markdown
[Overview](../Overview)
```

[Overview](../Overview)

### Absolute path

If you write absolute path, Macana resolves it from the Vault root (document root).

```markdown
[Overview](/en/Overview.md)
```

[Overview](/en/Overview.md)

### Absolute path without file extension

You can omit the file extension part from the absolute path too.
This would also negatively affects build performance.

```markdown
[Overview](/en/Overview)
```

[Overview](/en/Overview)

### Shortest path when possible

Macana supports "Shortest path when possible" links, which is the default value for the recent Obsidian versions.
If Macana finds more than one file having the same name as the link target, Macana throws an error and aborts the build.

```markdown
[Overview](Overview)
```

[Overview](Overview)

## Limitation

### Filename confusion on extension-less path

When you have more than one file with same file stem (file name without file extension including the dot), you can't refer to the file without extension.

For example, if you have both `Foo/Bar.md` and `Foo/Bar.jpg` on a same directory, below `Foo/Baz.md` results in a build error, because Macana cannot decide which file to use.

```markdown
[Bar](./Bar)
```