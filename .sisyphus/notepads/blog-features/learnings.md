# Blog Features - Learnings and Conventions

## Project Conventions

### TypeScript

- Strict mode enabled - never use `any`, `@ts-ignore`, or `@ts-expect-error`
- ES modules (`"type": "module"` in package.json)
- JSX: Preact (`jsxImportSource: "preact"`)
- No semicolons (Prettier enforced)

### Naming

- Functions: camelCase
- Types/Interfaces: PascalCase
- Type guards: prefix with `is` (e.g., `isFullSlug()`)
- Components: PascalCase

### Patterns

- Use branded types for nominal typing: `type SlugLike<T> = string & { __brand: T }`
- Type guards must use `is` return type
- Explicit return types on public functions

## Canvas Implementation Notes

### Current State (as of 2026-02-01)

- CanvasPage.tsx: Full-page canvas renderer (Korean UI: "확대", "축소", "초기화")
- canvasPage.tsx: Emitter for canvas pages
- canvas.ts: Basic transformer (mostly empty)
- canvasTransclude.inline.ts: Client-side embed rendering

### Known Issues

1. CanvasNode interface duplicated in 3 files - needs refactoring
2. Canvas embed transformer missing for `![[file.canvas]]` syntax
3. LSP errors in all canvas-related files

## User Decisions (Approved)

1. **Canvas UI Language**: Korean (maintain existing)
2. **Image Lightbox Design**:
   - Background: dark (var(--dark) 90%)
   - Arrow navigation: supported
   - Zoom: NOT supported (keep simple)
3. **Related Posts Algorithm**:
   - Sort by shared tag count (descending)
   - Tie-breaker: most recent date
   - Max 5 posts
   - Exclude self
