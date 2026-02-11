# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quartz v4 static site generator for publishing an Obsidian digital garden as a blog. TypeScript + Preact, ES modules. This instance adds custom Canvas (`.canvas`) and Database (`.base`) file support.

**Requirements**: Node.js >= 22, npm >= 10.9.2

## Commands

```bash
npm run check              # TypeScript + Prettier check (CI)
npm run format             # Format all files with Prettier
npm run test               # Run all tests (Node.js native test runner)
npx tsx --test path/to/file.test.ts  # Run a single test file
npx quartz build           # Build static site to /public
npx quartz build --serve   # Build and serve with hot reload
```

## Architecture

### Build Pipeline

Files (`.md`, `.canvas`, `.base`) → **Parse** (remark/rehype AST) → **Filter** (e.g. RemoveDrafts) → **Emit** (HTML/assets to `/public`)

Orchestrated by `quartz/build.ts`. Incremental builds use `partialEmit` on emitters + WebSocket hot reload.

### Plugin System (`quartz/plugins/`)

Three plugin types, all defined in `quartz/plugins/types.ts`:

- **Transformers** — modify content during parse. Provide `markdownPlugins()` (remark) and/or `htmlPlugins()` (rehype). Examples: `FrontMatter`, `Latex`, `Canvas`, `Bases`
- **Filters** — decide what to publish via `shouldPublish()`. Example: `RemoveDrafts`
- **Emitters** — generate output files via `emit()`. Support `partialEmit()` for incremental builds. Examples: `ContentPage`, `CanvasPage`, `BasesPage`

Plugins are configured in `quartz.config.ts`. Page layout (which components go where) is in `quartz.layout.ts`.

### Component System (`quartz/components/`)

Preact components server-rendered to static HTML. Each `QuartzComponent` can attach:

- `css` — component styles (SCSS in `components/styles/`)
- `beforeDOMLoaded` / `afterDOMLoaded` — client-side scripts (`components/scripts/*.inline.ts`)

Props include `fileData` (current page metadata), `cfg` (global config), `allFiles`, `tree` (HAST), and `ctx` (build context).

### Branded Types (`quartz/util/path.ts`)

Path/slug safety via nominal typing:

```typescript
type SlugLike<T> = string & { __brand: T }
// FullSlug, RelativeSlug, FilePath, etc.
// Type guards: isFullSlug(), isRelativeSlug()
```

### Custom Features (this instance)

- **Canvas** (`plugins/transformers/canvas.ts` + `plugins/emitters/canvasPage.tsx`) — renders `.canvas` files as interactive SVG viewers with panzoom
- **Bases** (`plugins/transformers/bases.ts` + `plugins/emitters/basesPage.tsx`) — renders `.base` JSON files as filterable/sortable tables
- **Properties** (`components/Properties.tsx`) — right sidebar showing frontmatter metadata

## Code Style

Enforced by Prettier (`.prettierrc`):

- **No semicolons**
- Print width 100, tab width 2, trailing commas
- Run `npm run format` before committing

TypeScript strict mode:

- Never use `any`, `@ts-ignore`, or `@ts-expect-error`
- Use `import type` for type-only imports
- JSX via Preact (`jsxImportSource: "preact"`)

Naming: functions `camelCase`, types `PascalCase`, type guards prefixed with `is`, components `PascalCase.tsx`

## Testing

Node.js native test runner (`node:test`, `node:assert`). Test files are `*.test.ts` alongside source files.

```typescript
import test, { describe } from "node:test"
import assert from "node:assert/strict"

describe("Feature", () => {
  test("should work", () => {
    assert.strictEqual(actual, expected)
  })
})
```

## Key Files

| File                               | Purpose                                     |
| ---------------------------------- | ------------------------------------------- |
| `quartz.config.ts`                 | Plugin configuration, theme, site settings  |
| `quartz.layout.ts`                 | Page layout — which components appear where |
| `quartz/build.ts`                  | Build orchestration (parse → filter → emit) |
| `quartz/plugins/types.ts`          | Plugin interface definitions                |
| `quartz/components/types.ts`       | Component type definitions                  |
| `quartz/util/path.ts`              | Branded slug/path types and helpers         |
| `quartz/components/renderPage.tsx` | Main page renderer                          |
