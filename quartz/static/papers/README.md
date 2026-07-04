# Project / paper PDFs

Drop PDF files here, then reference them from `data/projects.yaml` with a
root-relative path (no leading slash):

```yaml
- name: "LLM Squid Game: ..."
  link: "https://gist-dslab.github.io/LLM-Squid-Game/"   # → "Link" button
  pdf: "static/papers/llm-squid-game.pdf"                # → "PDF" button
```

- Files here are served at `/<baseUrl>/static/papers/<file>.pdf`.
- The card resolves root-relative paths against the page, so they work both
  locally and under the GitHub Pages `/blog` base path.
- You may also use an absolute `https://…` URL instead of a local file.
- Leave `pdf: ""` (or omit it) to render the PDF button disabled ("coming soon").
