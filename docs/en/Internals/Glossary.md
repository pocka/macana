## Document

A parsed note or canvas in a Vault.
A *document* consists of *document metadata* and *document content*.

## Document metadata

Properties describing a *document* or a *document directory* required for generating a website.
*Document metadata* consists of a *document name* and *document title*.

## Document name

An identifier for a document, unique among a directory the document belongs to.
A *document name* appears in a generated URL, thus available characters are limited to:

- Alphabet (`a-z`, `A-Z`)
- Digit (`0-9`)
- Percent symbol (`%`)
- Hyphen (`-`)
- Dot (`.`)
- Underscore (`_`)
- Tilde (`~`)

## Document title

Human-readable text representing a title of the *document*.
Although there is no restriction on available characters, you should avoid using control characters. ([Unicode control characters - Wikipedia](https://en.wikipedia.org/wiki/Unicode_control_characters))

## Document directory

A directory (folder) containing *document metadata* and *document directories*.
A document directory consists of *document metadata* of its own and zero or more *document metadata* and/or *document directory*.

## Document tree

Tree structured data contains *document metadata* and *document directories* per locales.