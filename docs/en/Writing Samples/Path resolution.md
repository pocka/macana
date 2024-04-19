---
createdAt: 2024-04-15T23:00:00+09:00
updatedAt: 2024-04-15T23:00:00+09:00
---

## Supported path resolutions
### Relative

Relative link is the best format, especially if you consider compatibility to other tools.

```markdown
[Overview](../Overview.md)
```

[Overview](../Overview.md)

#### Without file extension

Although you can omit file extensions in the file path, this is not recommended if you care compatibility or portability.
This also affects performance.

```markdown
[Overview](../Overview)
```

[Overview](../Overview)

### Absolute

Absolute paths are resolved from the Vault root.

```markdown
[Overview](/en/Overview.md)
```

[Overview](/en/Overview.md)

#### Without file extension

You can omit file extensions in the absolute form, too.
This affects performance.

```markdown
[Overview](/en/Overview)
```

[Overview](/en/Overview)

### Shortest path when possible

Macana also supports "Shortest path when possible" links, which is the default value for the newer Obsidian versions.
When Vault has more than one file having same name, resolution will result in error.

```markdown
[Overview](Overview)
```

[Overview](Overview)

## Limitation

### Filename confusion on extension-less path

When you have more than one file with same file stem (filename without extension part), you can't refer to the file without extension.

For example, if you have both `Foo/Bar.md` and `Foo/Bar.jpg` on a same directory, below `Foo/Baz.md` results in a build error, because Macana cannot decide which file to use.

```markdown
[Bar](./Bar)
```