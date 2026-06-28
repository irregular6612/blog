# Academic Portfolio Landing + Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Quartz garden's front door into a modern academic portfolio — a sidebar-less landing page (hero, interests, news, publications, projects, talks, awards), a data-driven `/cv` page, and a restyled `/papers` dashboard — all sharing one cohesive "Classic Academic" design.

**Architecture:** All work stays inside the existing Quartz build. A new data layer (`data/*.yaml` + `quartz/util/portfolio.ts`) feeds three render surfaces (landing, CV, dashboard) that share a sidebar-less `landingLayout` and a shared `TopNav` component. Garden note pages are untouched structurally but inherit a refreshed global theme (serif headings, navy accent).

**Tech Stack:** TypeScript (strict, no semicolons), Preact (`jsxImportSource: preact`), Quartz v4 emitter/component system, `js-yaml` (already a dependency), Node.js native test runner.

## Global Constraints

- Node.js >= 22, npm >= 10.9.2.
- Code style: **no semicolons**, print width 100, tab width 2, trailing commas. Run `npm run format` before each commit.
- TypeScript strict: never use `any`, `@ts-ignore`, or `@ts-expect-error` (except the existing inline-script import idiom already in the codebase). Use `import type` for type-only imports.
- Naming: functions `camelCase`, types `PascalCase`, type guards `is*`, components `PascalCase.tsx`.
- Portfolio content lives in repo-root `data/` (git-tracked) — **never** under `content/` (the gitignored iCloud vault).
- Photo served from `quartz/static/profile/profile.jpg` → `/static/profile/profile.jpg`; monogram fallback when absent.
- Design tokens (direction "A — Classic Academic"): headings Newsreader (serif), body Source Sans 3, code IBM Plex Mono; navy ink `#1b2335`, link `#3a567d`, accent `#284b63`, page bg `#fbfbf9`. Light + dark mode required.
- `npm run check` (tsc + Prettier) and `npm run test` must pass at the end of every task.

---

## File Structure

**New files**

| Path | Responsibility |
| ---- | -------------- |
| `data/profile.yaml` | Hero/about: name, role, affiliation, bio, about, photo, interests, contacts |
| `data/news.yaml` | News timeline entries |
| `data/publications.yaml` | Publications (empty list initially) |
| `data/projects.yaml` | Projects with lab tags |
| `data/talks.yaml` | Talks (empty list initially) |
| `data/awards.yaml` | Awards (empty list initially) |
| `data/cv.yaml` | CV: optional pdf, education, experience |
| `quartz/util/portfolio.ts` | Types + YAML loader + `selectedPublications` + `labBadgeClass` + vfile augmentation |
| `quartz/util/portfolio.test.ts` | Loader/helper unit tests |
| `quartz/components/TopNav.tsx` | Shared top nav (brand, links, embedded Darkmode) + full-width grid override CSS |
| `quartz/components/pages/Portfolio.tsx` | Landing page body |
| `quartz/components/pages/CV.tsx` | CV page body |
| `quartz/plugins/emitters/academicLanding.tsx` | Emits `/` (overrides markdown index by running last) |
| `quartz/plugins/emitters/cvPage.tsx` | Emits `/cv` |

**Modified files**

| Path | Change |
| ---- | ------ |
| `quartz.config.ts` | Typography + colors; register `AcademicLanding` + `CVPage` emitters (after `ContentPage`) |
| `quartz.layout.ts` | Add `landingLayout`; import `TopNav` |
| `quartz/components/index.ts` | Export `TopNav`, `Portfolio`, `CV` |
| `quartz/plugins/emitters/index.ts` | Re-export `AcademicLanding`, `CVPage` |
| `quartz/components/pages/PapersDashboard.tsx` | Restyle CSS + add `portfolio-root` marker class |
| `quartz/plugins/emitters/papersDashboard.tsx` | Use `landingLayout` instead of `defaultContentPageLayout` |

---

### Task 1: Portfolio data layer (types + loader)

**Files:**
- Create: `data/profile.yaml`, `data/news.yaml`, `data/publications.yaml`, `data/projects.yaml`, `data/talks.yaml`, `data/awards.yaml`, `data/cv.yaml`
- Create: `quartz/util/portfolio.ts`
- Test: `quartz/util/portfolio.test.ts`

**Interfaces:**
- Produces (consumed by Tasks 5, 7, 8):
  - `loadPortfolio(dataDir?: string): PortfolioData`
  - `selectedPublications(pubs: Publication[]): Publication[]`
  - `labBadgeClass(lab: string): string` → `"lab-lcbl" | "lab-ds" | "lab-other"`
  - Types: `PortfolioData`, `Profile`, `Affiliation`, `Contact`, `NewsItem`, `Publication`, `PublicationLinks`, `Project`, `Talk`, `Award`, `CVData`, `CVEntry`
  - `declare module "vfile"` augmentation adding `portfolioData: PortfolioData`

- [ ] **Step 1: Write the data files**

`data/profile.yaml`:
```yaml
name: Juhyeon Park
role: Undergraduate Researcher
affiliation:
  lab: { name: DS Lab, url: https://sundong.kim }
  pi: { name: Sundong Kim, url: https://sundong.kim }
  institution: { name: GIST, url: https://www.gist.ac.kr, country: South Korea }
bio: >
  My research centers on human-like AI — drawing on human traits such as a sense of
  self and motivation to shape how AI behaves and is built. Starting from a simple
  question — what makes us human? — I work to translate those traits into the design
  and implementation of intelligent agents.
about: >
  I'm a fourth-year B.S. student at GIST and an undergraduate researcher in the DS Lab.
  I'm broadly interested in machine learning, deep learning, and statistics, and
  increasingly in how cognition and neuroscience can inform the design of more
  human-like agents. Previously I worked in the Language Cognition and Brain Lab (LCBL).
photo: ""
interests:
  - Human-like AI
  - Self & Motivation
  - Artificial Intelligence
  - Deep Learning
  - Statistics
  - Reinforcement Learning
  - Neuroscience
contacts:
  - { kind: email, label: juhyeon-park@gm.gist.ac.kr, href: "mailto:juhyeon-park@gm.gist.ac.kr" }
  - { kind: email, label: Gmail, href: "mailto:irregular6612@gmail.com" }
  - { kind: github, label: GitHub, href: "https://github.com/irregular6612" }
  - { kind: orcid, label: ORCID, href: "", soon: true }
  - { kind: scholar, label: Google Scholar, href: "", soon: true }
```

`data/news.yaml`:
```yaml
- { date: 2026, html: "Joined the <a href='https://sundong.kim'>DS Lab</a> at GIST as an undergraduate researcher." }
- { date: 2025, html: "Worked in the Language Cognition and Brain Lab (LCBL)." }
```

`data/publications.yaml`:
```yaml
[]
```

`data/projects.yaml`:
```yaml
- { name: "Generated Face Rating: AI vs. Human", lab: "LCBL", desc: "comparison study", url: "" }
- { name: "KE Corpus", lab: "LCBL", desc: "corpus construction", url: "" }
- { name: "Phonetic Convergence", lab: "LCBL", desc: "speech / cognition", url: "" }
- { name: "LLM-Squid Game", lab: "DS Lab", desc: "LLM agent benchmark", url: "" }
- { name: "AgentnessArena", lab: "DS Lab", desc: "agent evaluation", url: "" }
```

`data/talks.yaml`:
```yaml
[]
```

`data/awards.yaml`:
```yaml
[]
```

`data/cv.yaml`:
```yaml
pdf: ""
education:
  - { period: "2021–present", degree: "B.S.", field: "Electrical Engineering and Computer Science", org: "GIST" }
experience:
  - { period: "2026–present", role: "Undergraduate Researcher", org: "DS Lab, GIST", url: "https://sundong.kim" }
  - { period: "2025–2026", role: "Undergraduate Researcher", org: "Language Cognition and Brain Lab (LCBL)" }
```

> Note: `cv.yaml` education field/dates are best-effort placeholders; the owner edits them later (open item — non-blocking).

- [ ] **Step 2: Write the failing test**

`quartz/util/portfolio.test.ts`:
```typescript
import test, { describe } from "node:test"
import assert from "node:assert/strict"
import fs from "fs"
import os from "os"
import path from "path"
import { loadPortfolio, selectedPublications, labBadgeClass } from "./portfolio"
import type { Publication } from "./portfolio"

function fixtureDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-"))
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content)
  }
  return dir
}

const MIN_PROFILE = `name: Juhyeon Park
role: Undergraduate Researcher
affiliation:
  institution: { name: GIST }
bio: hello
interests: [AI]
contacts: []
`

describe("loadPortfolio", () => {
  test("loads profile and defaults missing files", () => {
    const dir = fixtureDir({ "profile.yaml": MIN_PROFILE })
    const data = loadPortfolio(dir)
    assert.equal(data.profile.name, "Juhyeon Park")
    assert.deepEqual(data.news, [])
    assert.deepEqual(data.publications, [])
    assert.deepEqual(data.projects, [])
    assert.deepEqual(data.cv, { education: [], experience: [] })
  })

  test("throws when profile.yaml is missing", () => {
    const dir = fixtureDir({})
    assert.throws(() => loadPortfolio(dir), /profile not found/)
  })

  test("parses a projects list", () => {
    const dir = fixtureDir({
      "profile.yaml": MIN_PROFILE,
      "projects.yaml": `- { name: KE Corpus, lab: LCBL }\n- { name: AgentnessArena, lab: DS Lab }\n`,
    })
    const data = loadPortfolio(dir)
    assert.equal(data.projects.length, 2)
    assert.equal(data.projects[0].name, "KE Corpus")
    assert.equal(data.projects[1].lab, "DS Lab")
  })
})

describe("selectedPublications", () => {
  const pubs: Publication[] = [
    { year: 2024, title: "A", authors: "x", venue: "v" },
    { year: 2026, title: "B", authors: "x", venue: "v", selected: true },
    { year: 2025, title: "C", authors: "x", venue: "v", selected: true },
  ]
  test("prefers selected, sorted by year desc", () => {
    assert.deepEqual(
      selectedPublications(pubs).map((p) => p.title),
      ["B", "C"],
    )
  })
  test("falls back to all when none selected, sorted by year desc", () => {
    const none = pubs.map((p) => ({ ...p, selected: false }))
    assert.deepEqual(
      selectedPublications(none).map((p) => p.title),
      ["B", "C", "A"],
    )
  })
})

describe("labBadgeClass", () => {
  test("maps known labs", () => {
    assert.equal(labBadgeClass("LCBL"), "lab-lcbl")
    assert.equal(labBadgeClass("DS Lab"), "lab-ds")
  })
  test("unknown lab gets neutral badge", () => {
    assert.equal(labBadgeClass("Other Lab"), "lab-other")
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx tsx --test quartz/util/portfolio.test.ts`
Expected: FAIL — cannot find module `./portfolio`.

- [ ] **Step 4: Write the loader**

`quartz/util/portfolio.ts`:
```typescript
import fs from "fs"
import path from "path"
import yaml from "js-yaml"

export interface Contact {
  kind: string
  label: string
  href: string
  soon?: boolean
}

export interface Affiliation {
  lab?: { name: string; url?: string }
  pi?: { name: string; url?: string }
  institution?: { name: string; url?: string; country?: string }
}

export interface Profile {
  name: string
  role: string
  affiliation: Affiliation
  bio: string
  about?: string
  photo?: string
  interests: string[]
  contacts: Contact[]
}

export interface NewsItem {
  date: string | number
  html: string
}

export interface PublicationLinks {
  pdf?: string
  code?: string
  doi?: string
}

export interface Publication {
  year: number
  title: string
  authors: string
  venue: string
  links?: PublicationLinks
  selected?: boolean
}

export interface Project {
  name: string
  lab: string
  desc?: string
  url?: string
}

export interface Talk {
  title: string
  event?: string
  date?: string
  slides?: string
}

export interface Award {
  title: string
  org?: string
  year?: string | number
}

export interface CVEntry {
  period: string
  role?: string
  degree?: string
  field?: string
  org: string
  url?: string
}

export interface CVData {
  pdf?: string
  education: CVEntry[]
  experience: CVEntry[]
}

export interface PortfolioData {
  profile: Profile
  news: NewsItem[]
  publications: Publication[]
  projects: Project[]
  talks: Talk[]
  awards: Award[]
  cv: CVData
}

const EMPTY_CV: CVData = { education: [], experience: [] }

function readYaml<T>(dir: string, file: string, fallback: T): T {
  const fp = path.join(dir, file)
  if (!fs.existsSync(fp)) return fallback
  const parsed = yaml.load(fs.readFileSync(fp, "utf-8"))
  return (parsed ?? fallback) as T
}

export function loadPortfolio(dataDir: string = path.join(process.cwd(), "data")): PortfolioData {
  const profile = readYaml<Profile | null>(dataDir, "profile.yaml", null)
  if (!profile) {
    throw new Error(`Portfolio profile not found at ${path.join(dataDir, "profile.yaml")}`)
  }
  return {
    profile,
    news: readYaml<NewsItem[]>(dataDir, "news.yaml", []),
    publications: readYaml<Publication[]>(dataDir, "publications.yaml", []),
    projects: readYaml<Project[]>(dataDir, "projects.yaml", []),
    talks: readYaml<Talk[]>(dataDir, "talks.yaml", []),
    awards: readYaml<Award[]>(dataDir, "awards.yaml", []),
    cv: readYaml<CVData>(dataDir, "cv.yaml", EMPTY_CV),
  }
}

export function selectedPublications(pubs: Publication[]): Publication[] {
  const sel = pubs.filter((p) => p.selected)
  const chosen = sel.length > 0 ? sel : pubs
  return chosen.slice().sort((a, b) => b.year - a.year)
}

export function labBadgeClass(lab: string): string {
  const key = lab.trim().toLowerCase()
  if (key === "lcbl") return "lab-lcbl"
  if (key === "ds lab" || key === "dslab") return "lab-ds"
  return "lab-other"
}

declare module "vfile" {
  interface DataMap {
    portfolioData: PortfolioData
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx --test quartz/util/portfolio.test.ts`
Expected: PASS (all describes green).

- [ ] **Step 6: Format, typecheck, commit**

```bash
npm run format
npm run check
git add data quartz/util/portfolio.ts quartz/util/portfolio.test.ts
git commit -m "feat(portfolio): add data files and YAML loader with tests"
```

---

### Task 2: Global theme refresh

**Files:**
- Modify: `quartz.config.ts` (typography block ~lines 30-34; colors block ~lines 35-58)

**Interfaces:**
- Produces: refreshed CSS variables (`--light`, `--dark`, `--secondary`, `--tertiary`, `--gray`, `--lightgray`) consumed by every component's CSS.

- [ ] **Step 1: Replace the typography block**

In `quartz.config.ts`, replace:
```typescript
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
```
with:
```typescript
      typography: {
        header: "Newsreader",
        body: "Source Sans 3",
        code: "IBM Plex Mono",
      },
```

- [ ] **Step 2: Replace the colors block**

Replace the entire `colors: { lightMode: {...}, darkMode: {...} }` block with:
```typescript
      colors: {
        lightMode: {
          light: "#fbfbf9",
          lightgray: "#e6e6e2",
          gray: "#9aa3af",
          darkgray: "#4a5568",
          dark: "#1b2335",
          secondary: "#3a567d",
          tertiary: "#284b63",
          highlight: "rgba(58, 86, 125, 0.10)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#2c2c30",
          gray: "#8a8f98",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#9db4cc",
          tertiary: "#7b97aa",
          highlight: "rgba(125, 151, 170, 0.12)",
          textHighlight: "#b3aa0288",
        },
      },
```

- [ ] **Step 3: Build smoke test**

Run: `npx quartz build 2>&1 | tail -5`
Expected: build completes (`Emitted N files` / `Done processing`), no errors.

- [ ] **Step 4: Visual check (light + dark)**

Run: `cd public && python3 -m http.server 8099` (background), then open `http://localhost:8099/` and a sample garden page; toggle dark mode. Confirm serif headings + navy accent render and text is legible in both modes. Stop the server when done.

- [ ] **Step 5: Format, typecheck, commit**

```bash
npm run format
npm run check
git add quartz.config.ts
git commit -m "feat(theme): adopt Classic Academic typography and color palette"
```

---

### Task 3: TopNav component (with embedded Darkmode + full-width grid override)

**Files:**
- Create: `quartz/components/TopNav.tsx`
- Modify: `quartz/components/index.ts` (export `TopNav`)

**Interfaces:**
- Consumes: `Darkmode` component, `resolveRelative`, `concatenateResources`.
- Produces (consumed by Task 4 layout): default export `QuartzComponentConstructor` `TopNav`. Renders `<nav class="topnav">`. Its CSS includes the `#quartz-body:has(.portfolio-root)` full-width grid override consumed by Tasks 5/7/8 (which render a `.portfolio-root` root element).

- [ ] **Step 1: Write the component**

`quartz/components/TopNav.tsx`:
```tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, FullSlug } from "../util/path"
import { concatenateResources } from "../util/resources"
import Darkmode from "./Darkmode"

const DarkmodeInner = Darkmode()

interface NavLink {
  label: string
  target: FullSlug
  anchor?: string
}

// "Wiki" points at the AI folder page as a garden entry — change target if desired.
const LINKS: NavLink[] = [
  { label: "About", target: "index" as FullSlug, anchor: "#about" },
  { label: "Publications", target: "index" as FullSlug, anchor: "#publications" },
  { label: "Projects", target: "index" as FullSlug, anchor: "#projects" },
  { label: "Papers", target: "papers" as FullSlug },
  { label: "Wiki", target: "AI" as FullSlug },
  { label: "CV", target: "cv" as FullSlug },
]

const TopNav: QuartzComponent = (props: QuartzComponentProps) => {
  const slug = props.fileData.slug!
  const home = resolveRelative(slug, "index" as FullSlug)
  return (
    <nav class="topnav">
      <a class="topnav-brand" href={home}>
        Juhyeon Park
      </a>
      <div class="topnav-links">
        {LINKS.map((l) => (
          <a class="topnav-link" key={l.label} href={resolveRelative(slug, l.target) + (l.anchor ?? "")}>
            {l.label}
          </a>
        ))}
        <DarkmodeInner {...props} />
      </div>
    </nav>
  )
}

TopNav.css = concatenateResources(
  `
.topnav {
  display: flex; align-items: center; gap: 1.2rem;
  padding: 0.9rem 0; margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--lightgray);
  position: sticky; top: 0; z-index: 5;
  background: var(--light);
}
.topnav-brand { font-family: var(--headerFont); font-weight: 600; font-size: 1.1rem; color: var(--dark); margin-right: auto; text-decoration: none; }
.topnav-links { display: flex; align-items: center; gap: 1.1rem; }
.topnav-link { font-size: 0.85rem; color: var(--gray); text-decoration: none; }
.topnav-link:hover { color: var(--secondary); }
@media all and (max-width: 600px) {
  .topnav { flex-wrap: wrap; gap: 0.6rem; }
  .topnav-links { gap: 0.7rem; flex-wrap: wrap; }
}

/* Full-width: collapse the Quartz grid to one column on portfolio surfaces */
#quartz-body:has(.portfolio-root) {
  grid-template-columns: auto !important;
  grid-template-areas:
    "grid-header"
    "grid-center"
    "grid-footer" !important;
}
#quartz-body:has(.portfolio-root) .center {
  max-width: 920px; width: 100%; margin: 0 auto;
}
/* renderPage always emits empty .left/.right sidebar wrappers — hide them here */
#quartz-body:has(.portfolio-root) .sidebar { display: none !important; }
`,
  DarkmodeInner.css,
)
TopNav.beforeDOMLoaded = DarkmodeInner.beforeDOMLoaded
TopNav.afterDOMLoaded = DarkmodeInner.afterDOMLoaded

export default (() => TopNav) satisfies QuartzComponentConstructor
```

- [ ] **Step 2: Export it**

In `quartz/components/index.ts` add an import near the others:
```typescript
import TopNav from "./TopNav"
```
and add `TopNav` to the `export { ... }` list.

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: PASS (no type errors). (TopNav isn't rendered yet — this only verifies it compiles and exports.)

- [ ] **Step 4: Format, commit**

```bash
npm run format
git add quartz/components/TopNav.tsx quartz/components/index.ts
git commit -m "feat(portfolio): add shared TopNav with embedded dark-mode toggle"
```

---

### Task 4: Sidebar-less `landingLayout`

**Files:**
- Modify: `quartz.layout.ts` (import + new export)

**Interfaces:**
- Consumes: `TopNav` from `quartz/components`; `FullPageLayout` type from `./quartz/cfg`.
- Produces (consumed by Tasks 6, 7, 8): `landingLayout: Partial<FullPageLayout>` with `beforeBody: [TopNav()]`, empty `header`/`left`/`right`/`afterBody`.

- [ ] **Step 1: Import `FullPageLayout`**

In `quartz.layout.ts`, change the first import line:
```typescript
import { PageLayout, SharedLayout } from "./quartz/cfg"
```
to:
```typescript
import { PageLayout, SharedLayout, FullPageLayout } from "./quartz/cfg"
```

- [ ] **Step 2: Add the layout**

After the existing `defaultListPageLayout` export, append:
```typescript
// Sidebar-less layout for portfolio surfaces (landing, CV, papers dashboard).
// Emitters spread sharedPageComponents first, then landingLayout — so header: []
// here drops the shared ReadingProgress bar; empty left/right drop wiki sidebars.
export const landingLayout: Partial<FullPageLayout> = {
  header: [],
  beforeBody: [Component.TopNav()],
  afterBody: [],
  left: [],
  right: [],
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Format, commit**

```bash
npm run format
git add quartz.layout.ts
git commit -m "feat(portfolio): add sidebar-less landingLayout"
```

---

### Task 5: Portfolio page component

**Files:**
- Create: `quartz/components/pages/Portfolio.tsx`
- Modify: `quartz/components/index.ts` (export `Portfolio`)

**Interfaces:**
- Consumes: `fileData.portfolioData` (Task 1 type), `selectedPublications`, `labBadgeClass`, `resolveRelative`.
- Produces (consumed by Task 6 emitter): default export `QuartzComponentConstructor` `Portfolio`. Renders a root `<div class="portfolio-root">` with `id="about"`, `id="publications"`, `id="projects"` section anchors (matching TopNav).

- [ ] **Step 1: Write the component**

`quartz/components/pages/Portfolio.tsx`:
```tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import { selectedPublications, labBadgeClass } from "../../util/portfolio"
import type { Publication } from "../../util/portfolio"

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function PubLinks({ p }: { p: Publication }) {
  const items: { label: string; href: string }[] = []
  if (p.links?.pdf) items.push({ label: "PDF", href: p.links.pdf })
  if (p.links?.code) items.push({ label: "Code", href: p.links.code })
  if (p.links?.doi) items.push({ label: "DOI", href: p.links.doi })
  if (items.length === 0) return null
  return (
    <span class="pf-pub-links">
      {items.map((i) => (
        <a href={i.href} key={i.label} target="_blank" rel="noopener noreferrer">
          {i.label}
        </a>
      ))}
    </span>
  )
}

const Portfolio: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.portfolioData
  if (!data) return <p>No portfolio data.</p>
  const { profile, news, publications, projects, talks, awards } = data
  const slug = fileData.slug!
  const aff = profile.affiliation
  const pubs = selectedPublications(publications)
  const papersHref = resolveRelative(slug, "papers" as FullSlug)
  const wikiHref = resolveRelative(slug, "AI" as FullSlug)

  return (
    <div class="portfolio-root">
      <section class="pf-hero">
        {profile.photo ? (
          <img class="pf-photo" src={profile.photo} alt={profile.name} />
        ) : (
          <div class="pf-photo pf-monogram">{monogram(profile.name)}</div>
        )}
        <div class="pf-hero-main">
          <h1 class="pf-name">{profile.name}</h1>
          <p class="pf-role">{profile.role}</p>
          <p class="pf-affil">
            {aff.lab && (aff.lab.url ? <a href={aff.lab.url}>{aff.lab.name}</a> : aff.lab.name)}
            {aff.pi && (
              <> (PI: {aff.pi.url ? <a href={aff.pi.url}>{aff.pi.name}</a> : aff.pi.name})</>
            )}
            {aff.institution && (
              <>
                {" · "}
                {aff.institution.url ? (
                  <a href={aff.institution.url}>{aff.institution.name}</a>
                ) : (
                  aff.institution.name
                )}
                {aff.institution.country ? `, ${aff.institution.country}` : ""}
              </>
            )}
          </p>
          <p class="pf-bio">{profile.bio}</p>
          <div class="pf-contacts">
            {profile.contacts.map((c) =>
              c.soon || !c.href ? (
                <span class="pf-contact pf-soon" key={c.label}>
                  {c.label} — soon
                </span>
              ) : (
                <a
                  class="pf-contact"
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                >
                  {c.label}
                </a>
              ),
            )}
          </div>
        </div>
      </section>

      <section id="about" class="pf-section">
        <h2 class="pf-label">About</h2>
        <p class="pf-text">{profile.about ?? profile.bio}</p>
      </section>

      <section class="pf-section">
        <h2 class="pf-label">Research Interests</h2>
        <div class="pf-chips">
          {profile.interests.map((i) => (
            <span class="pf-chip" key={i}>
              {i}
            </span>
          ))}
        </div>
      </section>

      {news.length > 0 && (
        <section class="pf-section">
          <h2 class="pf-label">News</h2>
          <div class="pf-news">
            {news.map((n, idx) => (
              <div class="pf-news-row" key={idx}>
                <span class="pf-news-date">{n.date}</span>
                <span class="pf-news-text" dangerouslySetInnerHTML={{ __html: n.html }} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="publications" class="pf-section">
        <h2 class="pf-label">Selected Publications</h2>
        {pubs.length > 0 ? (
          <div class="pf-pubs">
            {pubs.map((p, idx) => (
              <div class="pf-pub" key={idx}>
                <span class="pf-pub-year">{p.year}</span>
                <span class="pf-pub-main">
                  <b>{p.title}</b>. {p.authors}. <i>{p.venue}</i>.
                </span>
                <PubLinks p={p} />
              </div>
            ))}
          </div>
        ) : (
          <p class="pf-empty">Publications will appear here soon.</p>
        )}
      </section>

      {projects.length > 0 && (
        <section id="projects" class="pf-section">
          <h2 class="pf-label">Projects</h2>
          <div class="pf-projects">
            {projects.map((pr, idx) => (
              <div class="pf-project" key={idx}>
                <span class="pf-project-name">{pr.name}</span>
                {pr.desc && <span class="pf-project-desc">{pr.desc}</span>}
                <span class={`pf-badge ${labBadgeClass(pr.lab)}`}>{pr.lab}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section class="pf-section">
        <h2 class="pf-label">Talks</h2>
        {talks.length > 0 ? (
          <div class="pf-news">
            {talks.map((t, idx) => (
              <div class="pf-news-row" key={idx}>
                <span class="pf-news-date">{t.date ?? ""}</span>
                <span class="pf-news-text">
                  {t.title}
                  {t.event ? `, ${t.event}` : ""}
                  {t.slides ? (
                    <>
                      {" "}
                      <a href={t.slides} target="_blank" rel="noopener noreferrer">
                        slides
                      </a>
                    </>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p class="pf-empty">No talks yet.</p>
        )}
      </section>

      <section class="pf-section">
        <h2 class="pf-label">Awards</h2>
        {awards.length > 0 ? (
          <div class="pf-news">
            {awards.map((a, idx) => (
              <div class="pf-news-row" key={idx}>
                <span class="pf-news-date">{a.year ?? ""}</span>
                <span class="pf-news-text">
                  {a.title}
                  {a.org ? `, ${a.org}` : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p class="pf-empty">No awards yet.</p>
        )}
      </section>

      <section class="pf-section">
        <h2 class="pf-label">Explore</h2>
        <div class="pf-explore">
          <a class="pf-card" href={papersHref}>
            <h3>📚 Research Papers →</h3>
            <p>An interactive dashboard of paper reviews — searchable and filterable.</p>
          </a>
          <a class="pf-card" href={wikiHref}>
            <h3>🧠 Knowledge Wiki →</h3>
            <p>My digital garden of linked notes, maintained as an LLM-curated wiki.</p>
          </a>
        </div>
      </section>
    </div>
  )
}

Portfolio.css = `
.portfolio-root { display: flex; flex-direction: column; }
.pf-hero { display: flex; gap: 1.8rem; align-items: flex-start; margin: 1rem 0 0.5rem; }
.pf-photo { width: 120px; height: 120px; border-radius: 16px; flex: 0 0 auto; object-fit: cover; }
.pf-monogram { background: var(--dark); color: var(--light); display: flex; align-items: center; justify-content: center; font-family: var(--headerFont); font-size: 2.6rem; }
.pf-name { font-family: var(--headerFont); font-weight: 500; font-size: 2.2rem; color: var(--dark); margin: 0 0 0.2rem; }
.pf-role { font-size: 1rem; color: var(--secondary); font-weight: 600; margin: 0 0 0.15rem; }
.pf-affil { font-size: 0.9rem; color: var(--gray); margin: 0 0 0.7rem; }
.pf-bio { font-size: 0.97rem; line-height: 1.6; max-width: 56ch; margin: 0.3rem 0 0.9rem; }
.pf-contacts { display: flex; gap: 0.55rem; flex-wrap: wrap; }
.pf-contact { font-size: 0.8rem; padding: 0.3rem 0.7rem; border-radius: 999px; background: var(--highlight); color: var(--secondary); border: 1px solid var(--lightgray); text-decoration: none; }
.pf-soon { color: var(--gray); }
.pf-section { padding-top: 1.3rem; margin-top: 1.3rem; border-top: 1px solid var(--lightgray); }
.pf-label { font-family: var(--bodyFont); font-size: 0.72rem; letter-spacing: 0.13em; text-transform: uppercase; color: var(--gray); font-weight: 600; margin: 0 0 0.7rem; }
.pf-text { font-size: 0.96rem; line-height: 1.62; max-width: 62ch; margin: 0; }
.pf-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.pf-chip { font-size: 0.85rem; padding: 0.3rem 0.75rem; border-radius: 7px; background: var(--highlight); color: var(--secondary); }
.pf-news { display: flex; flex-direction: column; }
.pf-news-row { display: flex; gap: 0.9rem; font-size: 0.92rem; padding: 0.35rem 0; line-height: 1.5; }
.pf-news-date { color: var(--gray); white-space: nowrap; flex: 0 0 5rem; font-variant-numeric: tabular-nums; }
.pf-news-text a { color: var(--secondary); }
.pf-pubs { display: flex; flex-direction: column; }
.pf-pub { display: flex; gap: 0.9rem; align-items: baseline; padding: 0.5rem 0; border-bottom: 1px dotted var(--lightgray); font-size: 0.9rem; line-height: 1.45; }
.pf-pub-year { color: var(--gray); flex: 0 0 3rem; font-variant-numeric: tabular-nums; }
.pf-pub-main { flex: 1; }
.pf-pub-links { white-space: nowrap; display: flex; gap: 0.5rem; }
.pf-pub-links a { font-size: 0.8rem; color: var(--secondary); }
.pf-projects { display: flex; flex-direction: column; gap: 0.55rem; }
.pf-project { display: flex; align-items: baseline; gap: 0.7rem; padding: 0.55rem 0.85rem; border: 1px solid var(--lightgray); border-radius: 9px; }
.pf-project-name { font-weight: 600; color: var(--dark); font-size: 0.95rem; }
.pf-project-desc { font-size: 0.84rem; color: var(--gray); }
.pf-badge { margin-left: auto; font-size: 0.7rem; padding: 0.18rem 0.55rem; border-radius: 999px; font-weight: 600; white-space: nowrap; }
.pf-badge.lab-lcbl { background: #eaf3ee; color: #2e6b4d; border: 1px solid #d6e8de; }
.pf-badge.lab-ds { background: var(--highlight); color: var(--secondary); border: 1px solid var(--lightgray); }
.pf-badge.lab-other { background: var(--lightgray); color: var(--darkgray); }
.pf-empty { font-size: 0.9rem; color: var(--gray); font-style: italic; }
.pf-explore { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.pf-card { border: 1px solid var(--lightgray); border-radius: 11px; padding: 1rem 1.1rem; text-decoration: none; }
.pf-card h3 { font-family: var(--headerFont); font-weight: 600; color: var(--dark); font-size: 1.05rem; margin: 0 0 0.3rem; }
.pf-card p { margin: 0; font-size: 0.85rem; color: var(--gray); line-height: 1.45; }
@media all and (max-width: 600px) {
  .pf-hero { flex-direction: column; gap: 1rem; }
  .pf-explore { grid-template-columns: 1fr; }
}
`

export default (() => Portfolio) satisfies QuartzComponentConstructor
```

- [ ] **Step 2: Export it**

In `quartz/components/index.ts` add:
```typescript
import Portfolio from "./pages/Portfolio"
```
and add `Portfolio` to the `export { ... }` list.

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Format, commit**

```bash
npm run format
git add quartz/components/pages/Portfolio.tsx quartz/components/index.ts
git commit -m "feat(portfolio): add Portfolio landing page component"
```

---

### Task 6: AcademicLanding emitter (owns `/`)

**Files:**
- Create: `quartz/plugins/emitters/academicLanding.tsx`
- Modify: `quartz/plugins/emitters/index.ts` (re-export)
- Modify: `quartz.config.ts` (register emitter AFTER `ContentPage`)

**Interfaces:**
- Consumes: `loadPortfolio` (Task 1), `Portfolio` (Task 5), `landingLayout` (Task 4), `sharedPageComponents`.
- Produces: emits `index.html` at `/`, injecting `vfile.data.portfolioData`. Runs after `ContentPage` so it overwrites the markdown-derived index (no need to edit the gitignored vault).

- [ ] **Step 1: Write the emitter**

`quartz/plugins/emitters/academicLanding.tsx`:
```tsx
import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FullSlug } from "../../util/path"
import { landingLayout, sharedPageComponents } from "../../../quartz.layout"
import { Portfolio as PortfolioComponent } from "../../components"
import { write } from "./helpers"
import { defaultProcessedContent } from "../vfile"
import { loadPortfolio } from "../../util/portfolio"

const LANDING_SLUG = "index" as FullSlug

export const AcademicLanding: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...landingLayout,
    pageBody: PortfolioComponent(),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "AcademicLanding",
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
      const portfolioData = loadPortfolio()

      const [tree, vfile] = defaultProcessedContent({
        slug: LANDING_SLUG,
        frontmatter: { title: portfolioData.profile.name, tags: [] },
      })
      vfile.data.portfolioData = portfolioData

      const externalResources = pageResources(pathToRoot(LANDING_SLUG), resources)
      const componentData: QuartzComponentProps = {
        ctx,
        fileData: vfile.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles,
      }

      const renderedContent = renderPage(cfg, LANDING_SLUG, componentData, opts, externalResources)

      yield write({ ctx, content: renderedContent, slug: LANDING_SLUG, ext: ".html" })
    },
  }
}
```

- [ ] **Step 2: Re-export from emitters index**

In `quartz/plugins/emitters/index.ts` add (next to the other re-exports):
```typescript
export { AcademicLanding } from "./academicLanding"
```

- [ ] **Step 3: Register in config, after ContentPage**

In `quartz.config.ts`, in the `emitters` array, add `Plugin.AcademicLanding()` on the line **immediately after** `Plugin.ContentPage(),`:
```typescript
      Plugin.ContentPage(),
      Plugin.AcademicLanding(),
```

- [ ] **Step 4: Build and verify `/` renders the portfolio**

Run: `npx quartz build 2>&1 | tail -5`
Expected: build succeeds.

Run: `grep -c "portfolio-root" public/index.html`
Expected: `1` (the landing component rendered; markdown index was overwritten).

Run: `grep -c "explorer\|graph-container" public/index.html`
Expected: `0` — no Explorer/Graph rendered (left/right are empty). Note: renderPage still emits empty `<div class="left sidebar">`/`<div class="right sidebar">` wrappers, which the `:has(.portfolio-root)` CSS hides; so do NOT assert on `class="sidebar"`.

- [ ] **Step 5: Visual check**

Serve `public/` (`cd public && python3 -m http.server 8099`), open `http://localhost:8099/`. Confirm: full-width hero with monogram, nav bar, all sections, dark-mode toggle works, anchors (`#about`, `#publications`, `#projects`) jump correctly. Stop the server.

- [ ] **Step 6: Format, typecheck, commit**

```bash
npm run format
npm run check
git add quartz/plugins/emitters/academicLanding.tsx quartz/plugins/emitters/index.ts quartz.config.ts
git commit -m "feat(portfolio): emit academic landing page at site root"
```

---

### Task 7: CV page (component + emitter)

**Files:**
- Create: `quartz/components/pages/CV.tsx`
- Create: `quartz/plugins/emitters/cvPage.tsx`
- Modify: `quartz/components/index.ts` (export `CV`)
- Modify: `quartz/plugins/emitters/index.ts` (re-export `CVPage`)
- Modify: `quartz.config.ts` (register `CVPage`)

**Interfaces:**
- Consumes: `fileData.portfolioData.cv`, `landingLayout`, `loadPortfolio`.
- Produces: `/cv` page; default export `CV` component (root `<div class="portfolio-root">`).

- [ ] **Step 1: Write the CV component**

`quartz/components/pages/CV.tsx`:
```tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import type { CVEntry } from "../../util/portfolio"

function EntryRow({ e }: { e: CVEntry }) {
  return (
    <div class="cv-row">
      <span class="cv-period">{e.period}</span>
      <span class="cv-main">
        <b>
          {e.role ?? [e.degree, e.field].filter(Boolean).join(", ")}
        </b>
        {e.org ? <span class="cv-org"> — {e.url ? <a href={e.url}>{e.org}</a> : e.org}</span> : null}
      </span>
    </div>
  )
}

const CV: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.portfolioData
  if (!data) return <p>No CV data.</p>
  const { profile, cv } = data

  return (
    <div class="portfolio-root cv-root">
      <section class="pf-hero cv-hero">
        <div class="pf-hero-main">
          <h1 class="pf-name">{profile.name} — CV</h1>
          <p class="pf-role">{profile.role}</p>
          {cv.pdf ? (
            <a class="pf-contact" href={cv.pdf} target="_blank" rel="noopener noreferrer">
              ⬇ Download PDF
            </a>
          ) : null}
        </div>
      </section>

      <section class="pf-section">
        <h2 class="pf-label">Education</h2>
        {cv.education.length > 0 ? (
          <div class="cv-list">
            {cv.education.map((e, idx) => (
              <EntryRow e={e} key={idx} />
            ))}
          </div>
        ) : (
          <p class="pf-empty">No entries yet.</p>
        )}
      </section>

      <section class="pf-section">
        <h2 class="pf-label">Experience</h2>
        {cv.experience.length > 0 ? (
          <div class="cv-list">
            {cv.experience.map((e, idx) => (
              <EntryRow e={e} key={idx} />
            ))}
          </div>
        ) : (
          <p class="pf-empty">No entries yet.</p>
        )}
      </section>
    </div>
  )
}

CV.css = `
.cv-list { display: flex; flex-direction: column; }
.cv-row { display: flex; gap: 1rem; align-items: baseline; padding: 0.5rem 0; border-bottom: 1px dotted var(--lightgray); font-size: 0.92rem; }
.cv-period { color: var(--gray); flex: 0 0 9rem; font-variant-numeric: tabular-nums; }
.cv-main { flex: 1; }
.cv-org { color: var(--gray); }
.cv-org a { color: var(--secondary); }
@media all and (max-width: 600px) {
  .cv-row { flex-direction: column; gap: 0.2rem; }
  .cv-period { flex-basis: auto; }
}
`

export default (() => CV) satisfies QuartzComponentConstructor
```

- [ ] **Step 2: Write the CV emitter**

`quartz/plugins/emitters/cvPage.tsx`:
```tsx
import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FullSlug } from "../../util/path"
import { landingLayout, sharedPageComponents } from "../../../quartz.layout"
import { CV as CVComponent } from "../../components"
import { write } from "./helpers"
import { defaultProcessedContent } from "../vfile"
import { loadPortfolio } from "../../util/portfolio"

const CV_SLUG = "cv" as FullSlug

export const CVPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...landingLayout,
    pageBody: CVComponent(),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "CVPage",
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
      const portfolioData = loadPortfolio()

      const [tree, vfile] = defaultProcessedContent({
        slug: CV_SLUG,
        frontmatter: { title: `${portfolioData.profile.name} — CV`, tags: [] },
      })
      vfile.data.portfolioData = portfolioData

      const externalResources = pageResources(pathToRoot(CV_SLUG), resources)
      const componentData: QuartzComponentProps = {
        ctx,
        fileData: vfile.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles,
      }

      const renderedContent = renderPage(cfg, CV_SLUG, componentData, opts, externalResources)
      yield write({ ctx, content: renderedContent, slug: CV_SLUG, ext: ".html" })
    },
  }
}
```

- [ ] **Step 3: Wire exports + registration**

In `quartz/components/index.ts`:
```typescript
import CV from "./pages/CV"
```
and add `CV` to the `export { ... }` list.

In `quartz/plugins/emitters/index.ts`:
```typescript
export { CVPage } from "./cvPage"
```

In `quartz.config.ts` emitters array, after `Plugin.AcademicLanding(),`:
```typescript
      Plugin.AcademicLanding(),
      Plugin.CVPage(),
```

- [ ] **Step 4: Build and verify**

Run: `npx quartz build 2>&1 | tail -5`
Expected: build succeeds.

Run: `test -f public/cv.html && grep -c "cv-root" public/cv.html`
Expected: file exists, count `1`.

- [ ] **Step 5: Format, typecheck, commit**

```bash
npm run format
npm run check
git add quartz/components/pages/CV.tsx quartz/components/index.ts quartz/plugins/emitters/cvPage.tsx quartz/plugins/emitters/index.ts quartz.config.ts
git commit -m "feat(portfolio): add data-driven /cv page"
```

---

### Task 8: Restyle the Papers dashboard (drop sidebars, match design)

**Files:**
- Modify: `quartz/plugins/emitters/papersDashboard.tsx` (swap layout)
- Modify: `quartz/components/pages/PapersDashboard.tsx` (marker class + CSS polish)

**Interfaces:**
- Consumes: `landingLayout` (Task 4). No change to `util/papers.ts` or the inline script (search/filter/sort behavior preserved).

- [ ] **Step 1: Swap the dashboard layout**

In `quartz/plugins/emitters/papersDashboard.tsx`:
- Change the import line
  ```typescript
  import { defaultContentPageLayout, sharedPageComponents } from "../../../quartz.layout"
  ```
  to
  ```typescript
  import { landingLayout, sharedPageComponents } from "../../../quartz.layout"
  ```
- Change the opts spread
  ```typescript
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: PapersDashboardComponent(),
  ```
  to
  ```typescript
    ...sharedPageComponents,
    ...landingLayout,
    pageBody: PapersDashboardComponent(),
  ```

- [ ] **Step 2: Add the full-width marker class to the dashboard root**

In `quartz/components/pages/PapersDashboard.tsx`, change the root element class:
```tsx
    <div id="papers-dashboard" class="papers-dashboard">
```
to
```tsx
    <div id="papers-dashboard" class="papers-dashboard portfolio-root">
```

- [ ] **Step 3: Polish the dashboard CSS to the new design**

In `quartz/components/pages/PapersDashboard.tsx`, update these rules inside the `PapersDashboard.css` template (replace the existing matching rules; leave others as-is):

```css
.papers-dashboard h1, #papers-dashboard { font-family: var(--bodyFont); }
.papers-statcard b { display: block; font-family: var(--headerFont); font-size: 1.5rem; color: var(--dark); line-height: 1.1; }
.papers-bar { height: 0.55rem; background: linear-gradient(90deg, var(--tertiary), var(--secondary)); border-radius: 4px; min-width: 2px; }
.papers-statcard { border: 1px solid var(--lightgray); border-radius: 11px; padding: 0.7rem 0.9rem; text-align: center; min-width: 5.5rem; background: var(--light); }
.papers-row { border-left: 3px solid transparent; }
.papers-spot-card { border-left: 3px solid var(--tertiary); }
```

Append these new rules at the end of the template (before the closing backtick):
```css
.papers-chart { border-radius: 11px; }
.papers-spotlight { border-radius: 11px; }
.papers-chip.active { background: var(--secondary); color: var(--light); border-color: var(--secondary); }
```

- [ ] **Step 4: Build and verify no sidebars + restyle present**

Run: `npx quartz build 2>&1 | tail -5`
Expected: build succeeds.

Run: `grep -c "explorer\|graph-container" public/papers.html`
Expected: `0` (no Explorer/Graph; left/right empty). As on the landing, empty `.sidebar` wrappers still exist and are hidden by CSS — do NOT assert on `class="sidebar"`.

Run: `grep -c "portfolio-root" public/papers.html`
Expected: `1`.

- [ ] **Step 5: Visual check**

Serve `public/`, open `http://localhost:8099/papers.html`. Confirm: same TopNav as landing, full-width, navy stat numbers + gradient bars, search/filter/sort still work, dark mode works. Stop the server.

- [ ] **Step 6: Format, typecheck, commit**

```bash
npm run format
npm run check
git add quartz/plugins/emitters/papersDashboard.tsx quartz/components/pages/PapersDashboard.tsx
git commit -m "feat(papers): restyle dashboard and drop wiki sidebars"
```

---

### Task 9: Full integration verification

**Files:** none created; verification only.

- [ ] **Step 1: Clean rebuild**

Run: `rm -rf public && npx quartz build 2>&1 | tail -8`
Expected: succeeds; emits `index.html`, `cv.html`, `papers.html`, plus garden pages.

- [ ] **Step 2: Full check + tests**

Run: `npm run check && npm run test 2>&1 | tail -15`
Expected: tsc + Prettier clean; all tests pass (including `portfolio.test.ts` and existing `papers.test.ts`).

- [ ] **Step 3: Cross-page nav + dark mode**

Serve `public/`. Click through `/` → Papers → CV → Wiki via the TopNav on each page; toggle dark mode on each. Confirm consistent nav, no wiki sidebars on landing/CV/dashboard, garden pages still have their explorer/graph sidebars and inherit the new typography. Capture light + dark screenshots of `/` for the record. Stop the server.

- [ ] **Step 4: Confirm landing owns `/` cleanly**

Run: `grep -c "portfolio-root" public/index.html`
Expected: `1` (no leftover markdown-index content; the emitter overwrote it).

- [ ] **Step 5: Final commit (if any formatting/screenshots) and wrap up**

```bash
git add -A
git commit -m "chore(portfolio): integration verification pass" --allow-empty
```

---

## Notes for the implementer

- **Old markdown index:** `content/index.md` is in the gitignored iCloud vault and is intentionally left alone. `AcademicLanding` runs after `ContentPage` and overwrites `index.html`. If a future reorder breaks this, the fallback is to set `draft: true` in `content/index.md`.
- **Photo:** drop `profile.jpg` into `quartz/static/profile/` and set `photo: /static/profile/profile.jpg` in `data/profile.yaml`. Until then the monogram shows.
- **ORCID/Scholar:** fill `href` in `data/profile.yaml` and remove `soon: true` when IDs exist.
- **"Wiki" nav target** is `AI` (a garden folder page). Change `LINKS` in `TopNav.tsx` to retarget.
- **Adding content** (publication/talk/award/news/project) is YAML-only — no component edits.
```
