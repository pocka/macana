They seem to do find-and-replace, hence many strange behavior.
Macana does not do the same parsing as it's quite unintuitive and AST-unfriendly.

## Basics

```markdown
> [!info]+ Title
> Body
```

> [!info]+ Title
> Body

## Escapes

```markdown
> \[!info]+ Title
> Body
```

> \[!info]+ Title
> Body

```markdown
> [!info]\+ Title
> Body
```

> [!info]\+ Title
> Body

```markdown
\> [!info]+ Title
> Body
```

\> [!info]+ Title
> Body

## Edge cases

### No whitespace before the marker

```markdown
>[!info]+ Title
>Body
```

>[!info]+ Title
>Body

### Phrasing semantics continues from title

```markdown
> [!info]+ **Bold _Italic
> Body, Italic_ Bold**
```

> [!info]+ **Bold _Italic
> Body, Italic_ Bold**

### Sequential markers

```markdown
> [!info]+ Title
> [!info]+ Title
> Body
```

> [!info]+ Title
> [!info]+ Title
> Body

### Whitespace in title

```markdown
> [!  info  ]+ Title
> Body
```

> [!  info  ]+ Title
> Body
### Whitespace before exclamation mark

```markdown
> [ !info]+ Title
> Body
```

> [ !info]+ Title
> Body

### Whitespace before foldable sign

Seriously?

```markdown
> [!info] + Title
> Body
```

> [!info] + Title
> Body

My guess is they incorrectly re-parse the rest of the first paragraph as block content, like this:

```markdown
+ Title\nBody
```

+ Title
  Body

Block quote works fine.

```markdown
> + Title
> Body
```

> + Title
> Body
