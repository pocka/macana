From https://help.obsidian.md/Editing+and+formatting/Obsidian+Flavored+Markdown:

> Obsidian supports [CommonMark](https://commonmark.org/), [GitHub Flavored Markdown](https://github.github.com/gfm/), and [LaTeX](https://www.latex-project.org/). **Obsidian does not support using Markdown formatting or blank lines inside of HTML tags**.

Emphasis by me. Now, let's see...

```markdown
<div>
  <p>
A. Plain
**Bold**
_Italic_

B. Plain ==Highlight== [[Roadmap]]
  </p>
  <p>C. Plain **Bold**</p>
</div>
```

<div>
  <p>
A. Plain
**Bold**
_Italic_

B. Plain ==Highlight== [[Roadmap]]
  </p>
  <p>C. Plain **Bold**</p>
</div>

```markdown
<span>D. Plain **Bold** ==Highlight==</span>
```

<span>D. Plain **Bold** ==Highlight==</span>

---

Obsidian renders every inner text as un-styled plain text in editing view. However, in reading view, it renders A and C as plain text but B and D as normal styled Markdown content.

They seems to use customized parser for the editing view and existing CommonMark (or GFM) parser for the reading view.