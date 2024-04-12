Macana is a tool to generate a static website from an Obsidian Vault.

![Logo|64](../Assets/logo.svg)

## Links

- [Source code](https://github.com/pocka/macana)
- [日本語版簡易ドキュメント](../ja/Overview.md)

## Goals

- Generate static HTML website from Obsidian Vault
- Output website can be readable even in JavaScript-disabled environment
- Simple and clean output without complicated configuration
- Library first; primary use-case is being used as a library, CLI is second class citizen
- Usable output for blog and documentation

## Non-goals

- Support for conventions other than Obsidian Vault
	- Although most of the feature should work as everything is directory and plain text file
- Complex and/or flexible customization
- Output for other than static, text-focused website: e.g. marketing page
- `npm create ***` bullshit, a.k.a. scaffolding first design 

## Motivation

I wanted a static site generator for my linking.

Every time I needed a documentation website or blog-like website, I've wrote them from scratch using libraries such as Next.js and Nano-jsx.
This approach is great: you can get full control on content structure and UIs.
However, it's time-consuming and extremely cost-inefficient.

There are quite a few Static Site Generators (SSGs) out there.
But I couldn't find one I liked.

### Arbitrary document tree

The first problem I encountered is, majority of them requires you to define *collections*, or data structure upfront.
Worse, some tools can handle only one collection (normally "Post") and other predefined non-collection contents (e.g. "About").

While I understand and have been doing the same for the past, this is not what I want.
After using Obsidian some times, I started believing format-less arbitrary document tree[^1] is the best way to personal writing.
Although this style is often compared to blog-style chronological ordered collection, you can chronologically sort a portion of your tree; arbitrary document tree is superset of chronological ordered collections, yay.

[^1]: Some people call it "digital garden".

Not having predefined content structure has downsides, of course.
With predefined contents structure, you can tune each contents specifically.
For example, you can create "Recent 3 posts" or "Most visited top 10 posts".
However, from my experience both as a website owner and as a *website viewer*, I've never felt these kind of things useful.
Easy to access content tree is, so this won't be a problem to my use-cases.

### Output quality

The second problem is, while not about SSGs themselves, is the quality of generated website generally being not good enough.
Default theme being bloated, broken layout on Firefox, contents completely embedded in JavaScript and no way to view with JavaScript disabled, barely usable on touch devices, etc...

This can be fixed by writing own theme, but writing from scratch is far easier than learning exotic template language and battling against un-deletable default styles/scripts.

### Solution: my own tool

Above pain points are, at all, boils down to "I don't like it" or "Does not solve my particular problem".
Writing a tool with or without reinventing the wheel is a natural behavior of a software engineer.
So here it is.