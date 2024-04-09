Highlight extension in Obsidian is so buggy... it changes between editing view and reading view.
So Macana does not strictly following the implementation: rather follow the same rule to GFM's strikethrough extension.

Many of these cases are **intentionally** excluded from unit tests, as there is no "correct" behavior.

## Basics

```markdown
==Hello, World!==
```

==Hello, World!==

## Escapes

```markdown
\==foo==
==bar\==baz
=====\=========
```

\==foo==
==bar\==baz
=====\=========

## Edge cases

### Avoid conflict with header usage (CommonMark)

```markdown
=====
```

=====

### Whitespaces

Whitespace right after the start `==` prevents the section from being highlighted.

```markdown
- == Not highlighted ==
- == Me too==
- ==I'm not highlighted in reading view      ==
```

- == Not highlighted ==
- == Me too==
- ==I'm not highlighted in reading view      ==

### No closing tags

It seems closing tag is optional. Ends at block end.

```markdown
==This is highlighted,
and this line too.

but this is not.
```

==This is highlighted,
and this line too.

but this is not.

### More than two symbols

```markdown
==========This is highlighted and 1+1=2 this too, ========but this isn't.
```

==========This is highlighted and 1+1=2 this too, ========but this isn't.

### Nested markers

```markdown
==Foo==Bar==Baz==
```

==Foo==Bar==Baz==