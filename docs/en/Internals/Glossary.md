## Document

A parsed note or canvas in a Vault.
A *document* consists of *document metadata* and *document content*.

## Document metadata

Properties describing a *document* or a *document directory* required for generating a website.
*Document metadata* consists of a *document name*, *document title*, whether the document is default document, and language of the document or the document directory.

## Document name

An identifier for a document, unique among a directory the document belongs to.

## Document title

Human-readable text representing a title of the *document*.
Although there is no restriction on available characters, you should avoid using control characters. ([Unicode control characters - Wikipedia](https://en.wikipedia.org/wiki/Unicode_control_characters))

## Document directory

A directory (folder) containing *document metadata* and *document directories*.
A document directory consists of *document metadata* of its own and zero or more *document metadata* and/or *document directory*.

## Document tree

Tree structured data contains *document metadata* and *document directories*.

## Document content

A parsed content of note or canvas.

## Document token

A string starts with `mxt_` that is used for referencing a document.

There are places where *Content Parser* needs a reference to *a document* while parsing another *document*, but unable to hold an object reference for the *document*.
In such case, *Content Parser* exchanges target *document*'s file path for a *document token*.
Then, *Page Builder* can exchange the *document token* for an actual *document* object reference later.

## Asset token

A string starts with `mxa_` that is used for referencing an asset.

Because of Macana's file I/O design and multi-phase build process, it's not preferable to pass a reference to an asset file around.
To avoid keeping references for asset files, *Content Parser* exchanges target asset's file path for an *asset token*.
Then, *Page Builder* can exchange the *asset token* for an actual asset file reference later.