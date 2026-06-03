# Research/Papers Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/papers` landing page that aggregates all `type: paper` notes at build time into stat cards, Category/Year bar charts, an "In progress" spotlight, and a client-filtered list.

**Architecture:** A new Quartz emitter (`PapersDashboard`) scans `allFiles` for `frontmatter.type === "paper"` at build time, normalizes each into a `PaperRecord`, aggregates counts, stashes the result on a synthetic page's `fileData.papersData`, and renders it through a new page-body component. All aggregation is pure functions (unit-tested); the page is server-rendered HTML with `data-*` attributes on each row, and a tiny vanilla-DOM inline script does search/filter/sort. No chart library, no runtime requests.

**Tech Stack:** TypeScript (strict, no semicolons, Prettier), Preact (SSR), Quartz v4 emitter/component API, Node native test runner (`node:test`).

---

## Context for the implementer (read once)

- **Quartz emitters** are async generators that `yield write({ ctx, content, slug, ext })`. They receive `content: ProcessedContent[]` where each item is `[hastTree, vfile]` and `vfile.data` is the per-note metadata (`QuartzPluginData`). Get all notes via `content.map((c) => c[1].data)`.
- **Custom frontmatter** is read as `file.frontmatter?.["Some-Key"]`. Paper notes use keys: `Reading-Status`, `Author`, `Published Year`, `Topic`, `Review-Date`, `Evidence-Quality`, `Reproducibility`, `URL`, `arXiv-ID`, `Category`, `type`.
- **`Reading-Status`** is usually a YAML list, so `frontmatter["Reading-Status"]` may be an array like `["☑️ Not Started"]`. Normalize defensively.
- **Synthetic pages** (pages with no backing `.md`) are built with `defaultProcessedContent({ slug, frontmatter })` from `quartz/plugins/vfile.ts` (see `folderPage.tsx`).
- **Stashing data for a component** follows the `BasesPage` pattern: assign to `vfile.data.<field>` and read it in the component via `props.fileData.<field>`. Type it with a `declare module "vfile" { interface DataMap { ... } }` augmentation (see `lastmod.ts`, `description.ts`).
- **Page-body components** live in `quartz/components/pages/`. They attach styles via `Component.css = \`...\`` (a CSS string, as `pages/BasesPage.tsx` does) and client scripts via `Component.afterDOMLoaded = script` (importing a `*.inline.ts`, as `Graph.tsx` does).
- **Relative links**: `resolveRelative(currentSlug, targetSlug)` from `quartz/util/path.ts`.
- Run a single test file: `npx tsx --test quartz/util/papers.test.ts`
- Type+style check: `npm run check`
- Build the site: `npx quartz build` (output goes to `public/`)

---

## File Structure

| File | Responsibility |
|---|---|
| `quartz/util/papers.ts` (create) | Pure data layer: types + `normalizeStatus`, `normalizeGrade`, `bucketCategory`, `parseYear`, `extractPaperRecord`, `aggregate`, `selectSpotlight`. Also the `vfile` `DataMap` augmentation for `papersData`. No rendering, no IO. |
| `quartz/util/papers.test.ts` (create) | Unit tests for the pure functions, incl. missing-field / build-non-breaking cases. |
| `quartz/components/pages/PapersDashboard.tsx` (create) | Reads `fileData.papersData`, server-renders stat cards + bar charts + spotlight + filter controls + list rows (with `data-*` attrs). Holds `.css` and wires `.afterDOMLoaded`. |
| `quartz/components/scripts/papersDashboard.inline.ts` (create) | Vanilla-DOM search/filter/sort over the rendered rows. Zero dependencies. |
| `quartz/plugins/emitters/papersDashboard.tsx` (create) | The emitter: filter `type:paper`, build `DashboardData`, stash on synthetic page, render, emit slug `papers`. |
| `quartz/components/index.ts` (modify) | Export `PapersDashboard`. |
| `quartz/plugins/emitters/index.ts` (modify) | Export `PapersDashboard`. |
| `quartz.config.ts` (modify) | Add `Plugin.PapersDashboard()` to `emitters`. |
| `content/index.md` (modify) | Add a `📚 [Papers 대시보드](/papers)` link. |

---

## Task 1: Pure data layer (`quartz/util/papers.ts`) — TDD

**Files:**
- Create: `quartz/util/papers.ts`
- Test: `quartz/util/papers.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `quartz/util/papers.test.ts`:

```typescript
import test, { describe } from "node:test"
import assert from "node:assert/strict"
import {
  normalizeStatus,
  normalizeGrade,
  bucketCategory,
  parseYear,
  extractPaperRecord,
  aggregate,
  selectSpotlight,
  TOP_CATEGORIES,
} from "./papers"

describe("normalizeStatus", () => {
  test("maps emoji list values to canonical status", () => {
    assert.equal(normalizeStatus(["▶️ In progress"]), "In progress")
    assert.equal(normalizeStatus(["✅ Done"]), "Done")
    assert.equal(normalizeStatus(["☑️ Not Started"]), "Not Started")
  })
  test("accepts plain strings case-insensitively", () => {
    assert.equal(normalizeStatus("in progress"), "In progress")
    assert.equal(normalizeStatus("DONE"), "Done")
  })
  test("missing or unknown becomes Unknown", () => {
    assert.equal(normalizeStatus(undefined), "Unknown")
    assert.equal(normalizeStatus("foo"), "Unknown")
    assert.equal(normalizeStatus([]), "Unknown")
  })
})

describe("normalizeGrade", () => {
  test("normalizes A-D", () => {
    assert.equal(normalizeGrade("A"), "A")
    assert.equal(normalizeGrade("c"), "C")
  })
  test("missing or invalid becomes Unknown", () => {
    assert.equal(normalizeGrade(undefined), "Unknown")
    assert.equal(normalizeGrade("E"), "Unknown")
  })
})

describe("bucketCategory", () => {
  test("keeps a top category as-is", () => {
    assert.equal(bucketCategory("Application"), "Application")
  })
  test("buckets long-tail and missing into Other", () => {
    assert.equal(bucketCategory("AI Bias / Political Bias"), "Other")
    assert.equal(bucketCategory(undefined), "Other")
  })
})

describe("parseYear", () => {
  test("parses numbers and numeric strings", () => {
    assert.equal(parseYear(2024), 2024)
    assert.equal(parseYear("2019"), 2019)
  })
  test("returns null for junk", () => {
    assert.equal(parseYear("N/A"), null)
    assert.equal(parseYear(undefined), null)
  })
})

describe("extractPaperRecord", () => {
  const fm = {
    title: "Attention Is All You Need",
    Author: "Vaswani et al.",
    "Published Year": 2017,
    Topic: "Architecture",
    "Reading-Status": ["✅ Done"],
    "Review-Date": "2025-01-02",
    "Evidence-Quality": "A",
    Reproducibility: "B",
    URL: "https://arxiv.org/abs/1706.03762",
    "arXiv-ID": "1706.03762",
    Category: "Architecture",
  }

  test("extracts a complete record", () => {
    const r = extractPaperRecord(fm, "AI/Papers/Attention")
    assert.equal(r.title, "Attention Is All You Need")
    assert.equal(r.slug, "AI/Papers/Attention")
    assert.equal(r.year, 2017)
    assert.equal(r.category, "Architecture")
    assert.equal(r.status, "Done")
    assert.equal(r.evidence, "A")
    assert.equal(r.reproducibility, "B")
    assert.equal(r.arxivId, "1706.03762")
  })

  test("does not throw and fills defaults when fields are missing", () => {
    const r = extractPaperRecord({}, "AI/Papers/Empty")
    assert.equal(r.title, "Empty")
    assert.equal(r.author, "—")
    assert.equal(r.year, null)
    assert.equal(r.category, "Other")
    assert.equal(r.status, "Unknown")
    assert.equal(r.evidence, "Unknown")
    assert.equal(r.url, null)
  })
})

describe("aggregate", () => {
  const records = [
    extractPaperRecord(
      { title: "A", "Published Year": 2024, Category: "Application", "Reading-Status": ["✅ Done"], "Evidence-Quality": "A" },
      "a",
    ),
    extractPaperRecord(
      { title: "B", "Published Year": 2024, Category: "Application", "Reading-Status": ["▶️ In progress"], "Evidence-Quality": "C" },
      "b",
    ),
    extractPaperRecord(
      { title: "C", "Published Year": 2019, Category: "Weird One-Off", "Reading-Status": ["☑️ Not Started"] },
      "c",
    ),
  ]

  test("computes headline counts", () => {
    const a = aggregate(records)
    assert.equal(a.total, 3)
    assert.equal(a.doneCount, 1)
    assert.equal(a.inProgressCount, 1)
    assert.equal(a.evidenceACount, 1)
    assert.equal(a.yearMin, 2019)
    assert.equal(a.yearMax, 2024)
  })

  test("byCategory counts buckets and puts Other last", () => {
    const a = aggregate(records)
    assert.deepEqual(a.byCategory[0], { key: "Application", count: 2 })
    assert.equal(a.byCategory[a.byCategory.length - 1].key, "Other")
  })

  test("byYear is sorted descending by year", () => {
    const a = aggregate(records)
    assert.deepEqual(
      a.byYear.map((b) => b.key),
      ["2024", "2019"],
    )
    assert.equal(a.byYear[0].count, 2)
  })
})

describe("selectSpotlight", () => {
  test("returns only In progress, newest Review-Date first, capped", () => {
    const recs = [
      extractPaperRecord({ title: "old", "Reading-Status": ["▶️ In progress"], "Review-Date": "2025-01-01" }, "old"),
      extractPaperRecord({ title: "new", "Reading-Status": ["▶️ In progress"], "Review-Date": "2025-06-01" }, "new"),
      extractPaperRecord({ title: "done", "Reading-Status": ["✅ Done"], "Review-Date": "2025-09-01" }, "done"),
    ]
    const s = selectSpotlight(recs, 6)
    assert.equal(s.length, 2)
    assert.equal(s[0].title, "new")
    assert.equal(s[1].title, "old")
  })
})

describe("TOP_CATEGORIES", () => {
  test("has the eight known buckets", () => {
    assert.equal(TOP_CATEGORIES.length, 8)
    assert.ok(TOP_CATEGORIES.includes("Application"))
  })
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx tsx --test quartz/util/papers.test.ts`
Expected: FAIL — module `./papers` does not exist / exports missing.

- [ ] **Step 3: Implement `quartz/util/papers.ts`**

Create `quartz/util/papers.ts`:

```typescript
export type QualityGrade = "A" | "B" | "C" | "D" | "Unknown"
export type ReadingStatus = "Not Started" | "In progress" | "Done" | "Unknown"

export interface PaperRecord {
  title: string
  slug: string
  author: string
  year: number | null
  category: string
  rawCategory: string
  topic: string
  status: ReadingStatus
  reviewDate: string | null
  evidence: QualityGrade
  reproducibility: QualityGrade
  url: string | null
  arxivId: string | null
}

export interface CountBucket {
  key: string
  count: number
}

export interface PaperAggregate {
  total: number
  doneCount: number
  inProgressCount: number
  evidenceACount: number
  categoryCount: number
  yearMin: number | null
  yearMax: number | null
  byCategory: CountBucket[]
  byYear: CountBucket[]
}

export interface DashboardData {
  records: PaperRecord[]
  aggregate: PaperAggregate
  spotlight: PaperRecord[]
}

export const TOP_CATEGORIES = [
  "Application",
  "Benchmark/Evaluation",
  "Architecture",
  "Theory",
  "Training",
  "Reasoning",
  "Survey",
  "Optimization",
] as const

const OTHER = "Other"

function firstValue(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw.length > 0 ? String(raw[0]) : ""
  }
  return raw == null ? "" : String(raw)
}

export function normalizeStatus(raw: unknown): ReadingStatus {
  const v = firstValue(raw).toLowerCase()
  if (v.includes("progress")) return "In progress"
  if (v.includes("done") || v.includes("✅")) return "Done"
  if (v.includes("not started") || v.includes("☑")) return "Not Started"
  return "Unknown"
}

export function normalizeGrade(raw: unknown): QualityGrade {
  const v = firstValue(raw).trim().toUpperCase().charAt(0)
  return v === "A" || v === "B" || v === "C" || v === "D" ? v : "Unknown"
}

export function bucketCategory(raw: unknown): string {
  const v = firstValue(raw).trim()
  return (TOP_CATEGORIES as readonly string[]).includes(v) ? v : OTHER
}

export function parseYear(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : parseInt(firstValue(raw), 10)
  return Number.isFinite(n) && n > 1900 && n < 2100 ? n : null
}

function slugTitle(slug: string): string {
  const last = slug.split("/").pop() ?? slug
  return last.length > 0 ? last : slug
}

export function extractPaperRecord(
  frontmatter: Record<string, unknown>,
  slug: string,
): PaperRecord {
  const fm = frontmatter ?? {}
  const rawCategory = firstValue(fm["Category"])
  const title = firstValue(fm["title"]) || slugTitle(slug)
  const author = firstValue(fm["Author"]) || "—"
  const topic = firstValue(fm["Topic"]) || "—"
  const url = firstValue(fm["URL"]) || null
  const arxivId = firstValue(fm["arXiv-ID"]) || null
  const reviewDateRaw = firstValue(fm["Review-Date"])
  const reviewDate = /^\d{4}-\d{2}-\d{2}$/.test(reviewDateRaw) ? reviewDateRaw : null

  return {
    title,
    slug,
    author,
    year: parseYear(fm["Published Year"]),
    category: bucketCategory(rawCategory),
    rawCategory: rawCategory || "—",
    topic,
    status: normalizeStatus(fm["Reading-Status"]),
    reviewDate,
    evidence: normalizeGrade(fm["Evidence-Quality"]),
    reproducibility: normalizeGrade(fm["Reproducibility"]),
    url,
    arxivId,
  }
}

function countBy(records: PaperRecord[], key: (r: PaperRecord) => string): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of records) {
    const k = key(r)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

export function aggregate(records: PaperRecord[]): PaperAggregate {
  const years = records.map((r) => r.year).filter((y): y is number => y != null)

  const catMap = countBy(records, (r) => r.category)
  const byCategory: CountBucket[] = [...catMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => {
      if (a.key === OTHER) return 1
      if (b.key === OTHER) return -1
      return b.count - a.count
    })

  const yearMap = countBy(
    records.filter((r) => r.year != null),
    (r) => String(r.year),
  )
  const byYear: CountBucket[] = [...yearMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => Number(b.key) - Number(a.key))

  return {
    total: records.length,
    doneCount: records.filter((r) => r.status === "Done").length,
    inProgressCount: records.filter((r) => r.status === "In progress").length,
    evidenceACount: records.filter((r) => r.evidence === "A").length,
    categoryCount: byCategory.length,
    yearMin: years.length ? Math.min(...years) : null,
    yearMax: years.length ? Math.max(...years) : null,
    byCategory,
    byYear,
  }
}

export function selectSpotlight(records: PaperRecord[], limit = 6): PaperRecord[] {
  return records
    .filter((r) => r.status === "In progress")
    .sort((a, b) => (b.reviewDate ?? "").localeCompare(a.reviewDate ?? ""))
    .slice(0, limit)
}

declare module "vfile" {
  interface DataMap {
    papersData: DashboardData
  }
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx tsx --test quartz/util/papers.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Type/style check**

Run: `npm run check`
Expected: no new errors from `quartz/util/papers.ts` or its test.

- [ ] **Step 6: Commit**

```bash
git add quartz/util/papers.ts quartz/util/papers.test.ts
git commit -m "feat(papers): add pure aggregation layer for papers dashboard

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Client inline script (`papersDashboard.inline.ts`)

**Files:**
- Create: `quartz/components/scripts/papersDashboard.inline.ts`

No unit test (DOM script); it is verified by the integration build in Task 5. The script operates on rows the component renders in Task 3, using this contract:
- Container `#papers-dashboard`
- Search input `#papers-search`
- Filter chip buttons `button.papers-chip[data-filter-group][data-filter-value]` (toggle `.active`)
- Sort `<select id="papers-sort">` with values `year` | `review` | `title`
- Each row `.papers-row` carries `data-title`, `data-author`, `data-category`, `data-year`, `data-status`, `data-evidence`
- Empty-state element `#papers-empty`

- [ ] **Step 1: Implement the script**

Create `quartz/components/scripts/papersDashboard.inline.ts`:

```typescript
type Group = "category" | "status" | "evidence"

function setupPapersDashboard() {
  const root = document.getElementById("papers-dashboard")
  if (!root) return

  const search = root.querySelector<HTMLInputElement>("#papers-search")
  const sort = root.querySelector<HTMLSelectElement>("#papers-sort")
  const listEl = root.querySelector<HTMLElement>("#papers-list")
  const emptyEl = root.querySelector<HTMLElement>("#papers-empty")
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>("button.papers-chip"))
  const rows = Array.from(root.querySelectorAll<HTMLElement>(".papers-row"))

  const active: Record<Group, Set<string>> = {
    category: new Set(),
    status: new Set(),
    evidence: new Set(),
  }

  function rowMatches(row: HTMLElement): boolean {
    const q = (search?.value ?? "").trim().toLowerCase()
    if (q) {
      const hay = `${row.dataset.title ?? ""} ${row.dataset.author ?? ""}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    for (const group of ["category", "status", "evidence"] as Group[]) {
      const set = active[group]
      if (set.size > 0 && !set.has(row.dataset[group] ?? "")) return false
    }
    return true
  }

  function apply() {
    let visible = 0
    for (const row of rows) {
      const show = rowMatches(row)
      row.style.display = show ? "" : "none"
      if (show) visible++
    }
    if (emptyEl) emptyEl.style.display = visible === 0 ? "" : "none"
  }

  function applySort() {
    if (!listEl || !sort) return
    const key = sort.value
    const sorted = [...rows].sort((a, b) => {
      if (key === "title") {
        return (a.dataset.title ?? "").localeCompare(b.dataset.title ?? "")
      }
      if (key === "review") {
        return (b.dataset.review ?? "").localeCompare(a.dataset.review ?? "")
      }
      // default: year desc
      return Number(b.dataset.year ?? "0") - Number(a.dataset.year ?? "0")
    })
    for (const row of sorted) listEl.appendChild(row)
  }

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      const group = chip.dataset.filterGroup as Group
      const value = chip.dataset.filterValue ?? ""
      if (!group) return
      if (active[group].has(value)) {
        active[group].delete(value)
        chip.classList.remove("active")
      } else {
        active[group].add(value)
        chip.classList.add("active")
      }
      apply()
    })
  }

  search?.addEventListener("input", apply)
  sort?.addEventListener("change", () => {
    applySort()
    apply()
  })

  applySort()
  apply()
}

document.addEventListener("nav", setupPapersDashboard)
```

Note: `document.addEventListener("nav", ...)` is Quartz's SPA navigation hook (used across inline scripts); it fires on each page load including SPA transitions.

- [ ] **Step 2: Type/style check**

Run: `npm run check`
Expected: no errors from the new file. (Full wiring is verified in Task 5.)

- [ ] **Step 3: Commit**

```bash
git add quartz/components/scripts/papersDashboard.inline.ts
git commit -m "feat(papers): add client search/filter/sort script

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Page-body component (`pages/PapersDashboard.tsx`)

**Files:**
- Create: `quartz/components/pages/PapersDashboard.tsx`

Reads `props.fileData.papersData` (populated by the emitter in Task 4) and server-renders the whole dashboard. Charts are inline `<div>` bars sized by percentage — no chart library.

- [ ] **Step 1: Implement the component**

Create `quartz/components/pages/PapersDashboard.tsx`:

```tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import {
  PaperRecord,
  CountBucket,
  TOP_CATEGORIES,
  ReadingStatus,
  QualityGrade,
} from "../../util/papers"
// @ts-ignore — Quartz bundles inline scripts as strings at build time
import script from "../scripts/papersDashboard.inline"

const STATUS_VALUES: ReadingStatus[] = ["Not Started", "In progress", "Done"]
const EVIDENCE_VALUES: QualityGrade[] = ["A", "B", "C", "D"]

function maxCount(buckets: CountBucket[]): number {
  return buckets.reduce((m, b) => Math.max(m, b.count), 1)
}

function BarChart({ title, buckets }: { title: string; buckets: CountBucket[] }) {
  const max = maxCount(buckets)
  return (
    <div class="papers-chart">
      <div class="papers-chart-label">{title}</div>
      {buckets.map((b) => (
        <div class="papers-barrow" key={b.key}>
          <span class="papers-barrow-key">{b.key}</span>
          <span class="papers-bar" style={`width:${(b.count / max) * 100}%`}></span>
          <span class="papers-barrow-count">{b.count}</span>
        </div>
      ))}
    </div>
  )
}

const PapersDashboard: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.papersData
  if (!data) return <p>No papers found.</p>
  const { records, aggregate, spotlight } = data
  const curSlug = fileData.slug!

  const stats: { label: string; value: string }[] = [
    { label: "Papers", value: String(aggregate.total) },
    { label: "Done + Reading", value: String(aggregate.doneCount + aggregate.inProgressCount) },
    { label: "Evidence A", value: String(aggregate.evidenceACount) },
    { label: "Categories", value: String(aggregate.categoryCount) },
    {
      label: "Year span",
      value:
        aggregate.yearMin && aggregate.yearMax
          ? `${aggregate.yearMin}–${aggregate.yearMax}`
          : "—",
    },
  ]

  const presentCategories = TOP_CATEGORIES.filter((c) =>
    records.some((r) => r.category === c),
  )
  if (records.some((r) => r.category === "Other")) presentCategories.push("Other" as never)

  const href = (r: PaperRecord) => resolveRelative(curSlug, r.slug as FullSlug)

  return (
    <div id="papers-dashboard" class="papers-dashboard">
      {/* 1. stat cards */}
      <div class="papers-stats">
        {stats.map((s) => (
          <div class="papers-statcard" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* 2. chart strip */}
      <div class="papers-charts">
        <BarChart title="By Category" buckets={aggregate.byCategory} />
        <BarChart title="By Year" buckets={aggregate.byYear} />
      </div>

      {/* 3. spotlight */}
      {spotlight.length > 0 && (
        <div class="papers-spotlight">
          <div class="papers-chart-label">▶ 지금 읽는 중</div>
          <div class="papers-spotlight-grid">
            {spotlight.map((r) => (
              <a class="papers-spot-card" href={href(r)} key={r.slug}>
                <span class="papers-spot-title">{r.title}</span>
                <span class="papers-spot-meta">
                  {r.year ?? "—"} · {r.category}
                  {r.reviewDate ? ` · ${r.reviewDate}` : ""}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 4. controls + list */}
      <div class="papers-controls">
        <input id="papers-search" class="papers-search" type="text" placeholder="제목·저자 검색…" />
        <select id="papers-sort" class="papers-sort">
          <option value="year">정렬: 연도 ↓</option>
          <option value="review">정렬: 리뷰일 ↓</option>
          <option value="title">정렬: 제목 ↑</option>
        </select>
      </div>

      <div class="papers-chipbar">
        {presentCategories.map((c) => (
          <button class="papers-chip" data-filter-group="category" data-filter-value={c} key={`c-${c}`}>
            {c}
          </button>
        ))}
        {STATUS_VALUES.map((s) => (
          <button class="papers-chip" data-filter-group="status" data-filter-value={s} key={`s-${s}`}>
            {s}
          </button>
        ))}
        {EVIDENCE_VALUES.map((e) => (
          <button class="papers-chip" data-filter-group="evidence" data-filter-value={e} key={`e-${e}`}>
            Ev {e}
          </button>
        ))}
      </div>

      <div id="papers-list" class="papers-list">
        {records.map((r) => (
          <div
            class="papers-row"
            key={r.slug}
            data-title={r.title}
            data-author={r.author}
            data-category={r.category}
            data-year={r.year ?? ""}
            data-status={r.status}
            data-evidence={r.evidence}
            data-review={r.reviewDate ?? ""}
          >
            <a class="papers-row-title" href={href(r)}>
              {r.title}
            </a>
            <span class="papers-row-year">{r.year ?? "—"}</span>
            <span class="papers-badge">{r.category}</span>
            <span class="papers-chiptag">Ev {r.evidence}</span>
            {r.url ? (
              <a class="papers-arxiv" href={r.url} target="_blank" rel="noopener noreferrer">
                arXiv↗
              </a>
            ) : (
              <span class="papers-arxiv-empty">—</span>
            )}
          </div>
        ))}
      </div>
      <p id="papers-empty" class="papers-empty" style="display:none">
        조건에 맞는 논문이 없습니다.
      </p>
    </div>
  )
}

PapersDashboard.css = `
.papers-dashboard { display: flex; flex-direction: column; gap: 1.2rem; }
.papers-stats { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.papers-statcard {
  border: 1px solid var(--lightgray); border-radius: 8px; padding: 0.5rem 0.9rem;
  text-align: center; min-width: 5rem; background: var(--light);
}
.papers-statcard b { display: block; font-size: 1.3rem; color: var(--secondary); line-height: 1.1; }
.papers-statcard span { font-size: 0.7rem; color: var(--gray); }
.papers-charts { display: flex; gap: 0.8rem; flex-wrap: wrap; }
.papers-chart {
  flex: 1; min-width: 240px; border: 1px solid var(--lightgray);
  border-radius: 8px; padding: 0.6rem 0.8rem;
}
.papers-chart-label {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--darkgray); margin-bottom: 0.4rem;
}
.papers-barrow { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; margin: 0.15rem 0; }
.papers-barrow-key { width: 6.5rem; text-align: right; color: var(--darkgray); flex-shrink: 0; }
.papers-bar { height: 0.6rem; background: var(--tertiary); border-radius: 3px; min-width: 2px; }
.papers-barrow-count { color: var(--gray); font-size: 0.7rem; }
.papers-spotlight {
  border: 1px solid var(--lightgray); border-radius: 8px; padding: 0.6rem 0.8rem; background: var(--light);
}
.papers-spotlight-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.4rem; }
.papers-spot-card {
  display: flex; flex-direction: column; gap: 0.2rem; padding: 0.5rem;
  border: 1px solid var(--lightgray); border-radius: 6px; text-decoration: none; background: var(--light);
}
.papers-spot-title { font-size: 0.85rem; color: var(--secondary); }
.papers-spot-meta { font-size: 0.7rem; color: var(--gray); }
.papers-controls { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.papers-search {
  flex: 1; min-width: 12rem; padding: 0.4rem 0.6rem;
  border: 1px solid var(--lightgray); border-radius: 6px; background: var(--light); color: var(--dark);
}
.papers-sort { padding: 0.4rem; border: 1px solid var(--lightgray); border-radius: 6px; background: var(--light); color: var(--dark); }
.papers-chipbar { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.papers-chip {
  font-size: 0.7rem; padding: 0.15rem 0.55rem; border-radius: 11px;
  border: 1px solid var(--tertiary); color: var(--secondary); background: transparent; cursor: pointer;
}
.papers-chip.active { background: var(--secondary); color: var(--light); border-color: var(--secondary); }
.papers-list { display: flex; flex-direction: column; }
.papers-row {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.35rem 0;
  border-bottom: 1px solid var(--lightgray); font-size: 0.8rem;
}
.papers-row-title { flex: 1; color: var(--secondary); text-decoration: none; }
.papers-row-year { color: var(--gray); width: 3rem; text-align: right; }
.papers-badge { font-size: 0.65rem; padding: 0.1rem 0.45rem; border-radius: 9px; background: var(--secondary); color: var(--light); }
.papers-chiptag { font-size: 0.65rem; padding: 0.1rem 0.45rem; border-radius: 9px; border: 1px solid var(--tertiary); color: var(--darkgray); }
.papers-arxiv { font-size: 0.7rem; color: var(--tertiary); }
.papers-arxiv-empty { font-size: 0.7rem; color: var(--lightgray); }
.papers-empty { color: var(--gray); font-size: 0.85rem; }
`

PapersDashboard.afterDOMLoaded = script

export default (() => PapersDashboard) satisfies QuartzComponentConstructor
```

- [ ] **Step 2: Type/style check**

Run: `npm run check`
Expected: no type errors. If the inline-script import errors on types, confirm the `// @ts-ignore` line directly precedes the `import script` line (mirrors how `Graph.tsx` imports its inline script — check that file for the exact convention and match it).

- [ ] **Step 3: Commit**

```bash
git add quartz/components/pages/PapersDashboard.tsx
git commit -m "feat(papers): add dashboard page-body component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Emitter (`emitters/papersDashboard.tsx`)

**Files:**
- Create: `quartz/plugins/emitters/papersDashboard.tsx`

Follows the `folderPage.tsx` synthetic-page pattern + the `BasesPage` stash pattern.

- [ ] **Step 1: Implement the emitter**

Create `quartz/plugins/emitters/papersDashboard.tsx`:

```tsx
import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FullSlug } from "../../util/path"
import { defaultContentPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { PapersDashboard as PapersDashboardComponent } from "../../components"
import { write } from "./helpers"
import { defaultProcessedContent } from "../vfile"
import { aggregate, extractPaperRecord, selectSpotlight, DashboardData } from "../../util/papers"

const DASHBOARD_SLUG = "papers" as FullSlug

export const PapersDashboard: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: PapersDashboardComponent(),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "PapersDashboard",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration

      const records = allFiles
        .filter((d) => d.frontmatter?.["type"] === "paper" && d.slug)
        .map((d) => extractPaperRecord(d.frontmatter as Record<string, unknown>, d.slug as string))

      const dashboardData: DashboardData = {
        records,
        aggregate: aggregate(records),
        spotlight: selectSpotlight(records),
      }

      const [tree, vfile] = defaultProcessedContent({
        slug: DASHBOARD_SLUG,
        frontmatter: { title: "Research Papers", tags: [] },
      })
      vfile.data.papersData = dashboardData

      const externalResources = pageResources(pathToRoot(DASHBOARD_SLUG), resources)
      const componentData: QuartzComponentProps = {
        ctx,
        fileData: vfile.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles,
      }

      const renderedContent = renderPage(
        cfg,
        DASHBOARD_SLUG,
        componentData,
        opts,
        externalResources,
      )

      yield write({
        ctx,
        content: renderedContent,
        slug: DASHBOARD_SLUG,
        ext: ".html",
      })
    },
  }
}
```

- [ ] **Step 2: Type/style check**

Run: `npm run check`
Expected: no type errors. (`vfile.data.papersData` is typed via the `DataMap` augmentation added in Task 1.)

- [ ] **Step 3: Commit**

```bash
git add quartz/plugins/emitters/papersDashboard.tsx
git commit -m "feat(papers): add build-time dashboard emitter at /papers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Wire-up + integration build verification

**Files:**
- Modify: `quartz/components/index.ts`
- Modify: `quartz/plugins/emitters/index.ts`
- Modify: `quartz.config.ts`
- Modify: `content/index.md`

- [ ] **Step 1: Export the component**

In `quartz/components/index.ts`, add the import next to the other `pages/` imports:

```typescript
import PapersDashboard from "./pages/PapersDashboard"
```

and add `PapersDashboard,` to the `export { ... }` block.

- [ ] **Step 2: Export the emitter**

In `quartz/plugins/emitters/index.ts`, add at the end:

```typescript
export { PapersDashboard } from "./papersDashboard"
```

- [ ] **Step 3: Register the emitter in config**

In `quartz.config.ts`, inside `emitters: [ ... ]`, add `Plugin.PapersDashboard(),` immediately after `Plugin.BasesPage(),`:

```typescript
      Plugin.CanvasPage(),
      Plugin.BasesPage(),
      Plugin.PapersDashboard(),
      Plugin.ContentPage(),
```

- [ ] **Step 4: Add the navigation link**

In `content/index.md`, under the `## 📚 주요 콘텐츠` heading, add a new entry above `### [Deep Learning]`:

```markdown
### [📚 Papers 대시보드](/papers)
538편의 논문 리뷰를 카테고리·연도·평가 기준으로 한눈에 — 검색·필터·정렬 가능
```

- [ ] **Step 5: Build the site and verify the page is generated**

Run: `npx quartz build`
Expected: build completes with no errors, and `public/papers.html` exists.

Verify the file exists and has content:

Run: `test -s public/papers.html && grep -c "papers-row" public/papers.html`
Expected: a number > 0 (one `papers-row` class occurrence per rendered paper plus styles).

- [ ] **Step 6: Full type/style check**

Run: `npm run check`
Expected: PASS (no type or Prettier errors).

- [ ] **Step 7: Run the whole test suite**

Run: `npm run test`
Expected: PASS (includes `quartz/util/papers.test.ts`).

- [ ] **Step 8: Manual smoke test (optional but recommended)**

Run: `npx quartz build --serve`
Open `http://localhost:8080/papers` and confirm: stat cards show, both bar charts render, spotlight shows In-progress papers, typing in search filters rows, clicking a category chip filters, changing sort reorders. Stop the server when done.

- [ ] **Step 9: Commit**

```bash
git add quartz/components/index.ts quartz/plugins/emitters/index.ts quartz.config.ts content/index.md
git commit -m "feat(papers): wire up dashboard emitter, component, and nav link

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- §3 data model → Task 1 (`extractPaperRecord`, types). ✓
- §3.3 missing-field handling → Task 1 Step 1 "fills defaults when fields are missing" test. ✓
- §3.3 Category bucketing (top 8 + Other) → Task 1 `bucketCategory` + `TOP_CATEGORIES`. ✓
- §4 architecture (emitter + pure module + component + script) → Tasks 1–4. ✓
- §4.2 changed files (config, indexes, index.md) → Task 5. ✓
- §5 page sections (stats, charts, spotlight, list) → Task 3. ✓
- §5.1 client search/filter/sort → Task 2. ✓
- §6 testing (pure functions, non-breaking on missing input) → Task 1. ✓
- §7 micro-decisions (link in index.md, no normalization) → Task 5 Step 4; original notes untouched. ✓
- §8 YAGNI (no chart lib, no heatmap, no JSON-embed-only) → bars are CSS; rows carry `data-*`. ✓

**Deviations from spec (intentional, simpler):**
- Spec §4.1 listed a separate `papersDashboard.scss`; this plan inlines CSS in the component as `pages/BasesPage.tsx` does (one fewer file, matches the closest analog).
- Spec §5.1 described an embedded JSON index; this plan instead renders rows with `data-*` attributes and filters the DOM directly — lighter, no JSON parse, works without JS. The `categoryCount` stat uses `byCategory.length` (buckets present) per §3.

**Placeholder scan:** none — every code step has complete code.

**Type consistency:** `PaperRecord`, `DashboardData`, `CountBucket`, `TOP_CATEGORIES`, `normalizeStatus/Grade`, `bucketCategory`, `aggregate`, `selectSpotlight` are defined in Task 1 and consumed with identical names/signatures in Tasks 3–4. The component/script DOM contract (ids, `.papers-row`, `data-*`, `.papers-chip[data-filter-group|value]`) matches between Task 2 and Task 3.

**One thing to watch during execution:** the inline-script import convention (`// @ts-ignore` + `import script from "../scripts/papersDashboard.inline"`). Open `quartz/components/Graph.tsx` and copy its exact import style for the inline script if `npm run check` complains in Task 3.
```
