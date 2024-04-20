## Basics

### Inline

```markdown
%%This is a comment%%
```

%%This is a comment%%

```markdown
Inline %%comment can't include
line-endings%%
```

Inline %%comment can't include
line-endings%%

The latter one is buggy inside Obsidian: renders this as "Inline (rest commented-out)" in edit view but `Inline %%comment can't include line-endings%%` in reading view.
### Block

```markdown
%%This
is
a
comment,
too
%%
```

%%This
is
a
comment,
too
%%

```markdown
%%
**bold**
%%
```

%%
**bold**
%%

Obsidian renders "bold" in bold in edit view.

## Escapes

```markdown
\%%This isn't a comment%% but this is%%
```

\%%This isn't a comment%% but this is%%

## Edge cases

### Triple percent sign

```markdown
%%%This is a comment%%
```

%%%This is a comment%%