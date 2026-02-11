# AGENTS.md - Quartz v4

Guide for AI agents working in this codebase.

## Project Overview

Quartz v4 is a static site generator for digital gardens and notes. It uses TypeScript, ES modules, and Preact for JSX components.

**Requirements**: Node.js >= 22, npm >= 10.9.2

## Build / Lint / Test Commands

```bash
# Type check + Prettier check (CI)
npm run check

# Format all files with Prettier
npm run format

# Run all tests
npm run test

# Run a single test file
npx tsx --test path/to/file.test.ts

# Build and serve docs locally
npm run docs

# CLI tool
npm run quartz
```

## Code Style Guidelines

### Formatting (Prettier)

- **No semicolons** (enforced)
- Print width: 100
- Tab width: 2 spaces
- Trailing commas: all
- Quote props: as-needed

### TypeScript

- **Strict mode enabled** - never use `any`, `@ts-ignore`, or `@ts-expect-error`
- ES modules (`"type": "module"` in package.json)
- Target: ESNext
- JSX: Preact (`jsxImportSource: "preact"`)
- Unused locals/parameters: error

### Naming Conventions

- Functions: camelCase
- Types/Interfaces: PascalCase
- Type guards: prefix with `is` (e.g., `isFullSlug()`)
- Components: PascalCase (e.g., `ContentPage.tsx`)

### Type Patterns

- Use **branded types** for nominal typing:
  ```typescript
  type SlugLike<T> = string & { __brand: T }
  export type FullSlug = SlugLike<"full">
  ```
- Type guards must use `is` return type:
  ```typescript
  export function isFullSlug(s: string): s is FullSlug
  ```
- Explicit return types on public functions
- Avoid `any` - use `unknown` or proper types

### Imports

- Use ES module syntax (`import/export`)
- Group imports: external deps → internal modules
- Use `import type` for type-only imports when possible

### Error Handling

- Use early returns to reduce nesting
- Prefer `try/catch` over error callbacks
- Use assertion functions from `node:assert` in tests

### Testing

- Test runner: Node.js native (`node:test`, `node:assert`)
- Test files: `*.test.ts` alongside source files
- Use `describe()` and `test()` from `node:test`
- Use `assert.strictEqual()`, `assert.deepStrictEqual()` for assertions

## Project Structure

```
quartz/
  components/      # Preact components (.tsx)
  plugins/         # Transformers, emitters, filters
  util/            # Utility functions
  i18n/            # Internationalization
  cfg.ts           # Configuration types
cfg.ts             # User configuration
```

## Editor Rules

No Cursor rules or Copilot instructions found. Follow this AGENTS.md and existing code patterns.
