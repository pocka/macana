This page lists supported YAML frontmatter fields.
## `name`

- Type: `string`

Name of the document.
This appears the final URL path and affects links.

For example, if a file named `/Foo.md` has below frontmatter,

```markdown
---
name: "Bar"
---

# Baz
```

the final URL would be like `http://localhost:8080/Bar/`.
You should avoid reaching to this field.

## `title`

- Type: `string`

Title of the document.
By default, file name is used as a title.

## `description`

- Type: `description`

Description text of the document.

## `lang`

- Type: `string`
- Alias: `language`
- Example: `en-US`, `ja`, `zh-Hans`

Language of the document.
This field value goes to HTML's `lang` tag, hence you should use language tag adheres to [RFC 5646 - Tags for Identifying Languages](https://datatracker.ietf.org/doc/html/rfc5646).

## `createdAt`

- Type: `string` (datetime)
- Example: `2020-01-01T08:30:00+05:00`

Creation time of the document.
While you can use various date time format for this field, you should stick to [Date Time String Format defined in ECMAScript](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-time-string-format) (`YYYY-MM-DDTHH:mm:ss.sssZ`).

## `updatedAt`

- Type: `string` (datetime)
- Example: `2020-01-01T08:30:00+05:00`

Update time of the document.
While you can use various date time format for this field, you should stick to [Date Time String Format defined in ECMAScript](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-time-string-format) (`YYYY-MM-DDTHH:mm:ss.sssZ`).

## `defaultDocument`

- Type: `boolean`

Whether this document is the default document of a generated website.
If more than one documents have this field set on, behavior is undefined.