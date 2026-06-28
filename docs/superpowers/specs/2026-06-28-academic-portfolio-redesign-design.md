# Academic Portfolio Landing + Visual Redesign — Design Spec

**Date:** 2026-06-28
**Author:** Juhyeon Park (with Claude Code)
**Status:** Draft for approval

---

## 1. Goal

Transform the site's first impression from a generic "digital garden" wiki into a
**modern academic portfolio**. On landing, a visitor should immediately see who
Juhyeon Park is, his research focus, publications, projects, and how to reach him —
in English, with the polish of a faculty/researcher homepage. The existing Quartz
garden (notes + Papers dashboard) remains, but is reframed as something the
portfolio *links into*, not the front door.

### Success criteria

- Visiting `/` shows a full-width academic landing page (no wiki sidebars): hero
  (photo, name, role, affiliation, bio, contact), About, Research Interests, News,
  Publications, Projects, Talks, Awards, and an "Explore" section linking to the
  Papers dashboard and the wiki.
- A consistent top navigation bar appears on the landing, CV, and dashboard: the
  brand ("Juhyeon Park") links home, followed by About · Publications · Projects ·
  Papers · Wiki · CV and the dark-mode toggle.
- The Papers dashboard is restyled to match the new design language and drops the
  wiki sidebars.
- A `/cv` page is generated from structured data, including the lab history
  (2025–2026 LCBL → 2026– DS Lab).
- All portfolio content is **data-driven** (YAML files in a repo-tracked `data/`
  directory) so adding a publication/project/talk/award/news item never requires
  touching components.
- Visual direction **A — Classic Academic**: serif headings (Newsreader), Source
  Sans body, navy accent, light/dark mode.
- Garden note pages keep their existing layout but inherit the refreshed
  typography/color so the whole site feels cohesive.

## 2. Non-goals (explicitly deferred)

- **LLM-wiki refinements** (lint precision, Tier-2 semantic lint, first ingest/query
  cycle, WIP-note commits). These are a separate, already-mostly-built system; they
  get their own spec later.
- Restructuring or restyling individual garden note pages beyond the global
  typography/color refresh.
- ORCID/Google Scholar integration (icons render as "coming soon" until IDs exist).
- Real publication content (the Publications section ships with an empty-state until
  `data/publications.yaml` has entries).
- Multilingual/i18n of the portfolio (portfolio is English; garden stays Korean).

## 3. Design direction — "A: Classic Academic"

| Token            | Light                       | Dark                        |
| ---------------- | --------------------------- | --------------------------- |
| Page background  | `#fbfbf9`                   | `#161618`                   |
| Heading / ink    | `#16233d` (navy)            | `#ebebec`                   |
| Accent (links)   | `#3a567d`                   | `#7b97aa`                   |
| Accent strong    | `#284b63` → `#3a6a8a` (bars)| same gradient, tuned        |
| Muted / labels   | `#9aa3af`                   | `#8a8f98`                   |
| Card surface     | `#ffffff`                   | `#1e1e20`                   |
| Hairline border  | `#ececec` / `#e9e9e4`       | `#2c2c30`                   |

**Typography** (Google Fonts, already the font mechanism in `quartz.config.ts`):

- Headings: **Newsreader** (serif, opsz) — weights 500/600.
- Body: **Source Sans 3** — 400/500/600.
- Code: keep **IBM Plex Mono**.

**Motifs:** generous whitespace, uppercase letter-spaced section labels, thin
hairline dividers, rounded-square photo, pill contact chips, navy left-accent on
cards. Lab affiliation uses colored badges (LCBL = green, DS Lab = navy).

## 4. Architecture

The site stays 100% Quartz (single build, single theme). Three render surfaces —
**Landing**, **CV**, **Papers dashboard** — share a new **sidebar-less layout** and a
shared **TopNav**. Garden pages are untouched structurally.

```
                       data/ (YAML, repo-tracked)
        profile · news · publications · projects · talks · awards · cv
                                 │
                    quartz/util/portfolio.ts   ← load + validate (js-yaml) + types
                                 │
        ┌────────────────────────┼─────────────────────────┐
        ▼                        ▼                          ▼
  AcademicLanding          CVPage emitter          PapersDashboard emitter
   emitter (/)                (/cv)                  (/papers, restyled)
        │                        │                          │
   Portfolio.tsx              CV.tsx               PapersDashboard.tsx (existing)
        └──────── all use landingLayout (TopNav, no left/right sidebars) ──────────┘
```

### 4.1 New sidebar-less layout (`landingLayout`)

Add to `quartz.layout.ts` a `landingLayout: PageLayout` with:

- `beforeBody: [TopNav()]`
- `left: []`, `right: []` (no Explorer, Graph, TOC, Backlinks, Properties)
- `afterBody: []`

The emitters merge `sharedPageComponents` + `landingLayout` (mirroring how
`papersDashboard.tsx` merges today). Because `left`/`right` are empty, the page grid
must render full-width — handled by a body class (see §7).

### 4.2 Shared TopNav component

`quartz/components/TopNav.tsx` — a `QuartzComponent` rendering the brand ("Juhyeon
Park" → `/`) and links: About (`/#about`), Publications (`/#publications`), Projects
(`/#projects`), Papers (`/papers`), Wiki (`/` of the garden, e.g. a chosen entry or
the explorer index), CV (`/cv`), plus the existing `Darkmode` component. Sticky on
scroll. Active-link styling via current slug. CSS in
`quartz/components/styles/topnav.scss`.

> Open question resolved during build: "Wiki" link target — default to a garden
> entry page (e.g. `/AI` or a tags index). Picked at implementation; trivially
> changed.

### 4.3 Landing emitter + Portfolio component

- `quartz/plugins/emitters/academicLanding.tsx` — emits `/` (`index` slug),
  overriding the markdown-derived index. Loads portfolio data via the loader, builds
  `fileData`, renders with `landingLayout` and `Portfolio()` as `pageBody` (same
  `renderPage` pattern as `papersDashboard.tsx`).
- `quartz/components/pages/Portfolio.tsx` — renders hero + all sections from data.
  Each section renders its empty-state when its data array is empty.
- **Index collision:** `content/index.md` currently emits `/` via `ContentPage`.
  Resolution: register `AcademicLanding` and, in `content/index.md`, either (a) set
  frontmatter `draft: true` so `RemoveDrafts` filters it, or (b) keep it but ensure
  `AcademicLanding` is ordered to win the `/` slug. **Chosen: (a)** — mark the old
  index as draft and let the emitter own `/`. (Old content preserved in git.)

### 4.4 CV page

- `quartz/plugins/emitters/cvPage.tsx` → `/cv`, same layout/pattern.
- `quartz/components/pages/CV.tsx` — renders from `data/cv.yaml`: education,
  experience/labs (incl. 2025–2026 LCBL → 2026– DS Lab), skills, etc. Includes an
  optional "Download PDF" button if `data/cv.yaml` declares a `pdf:` path
  (`/static/cv/...`). PDF itself is user-supplied later; absent → button hidden.

### 4.5 Papers dashboard restyle

Modify the **existing** `PapersDashboard.tsx` component + its SCSS to the new design
language, and change the emitter to use `landingLayout` instead of
`defaultContentPageLayout` (drops the graph/properties/backlinks/explorer). No change
to aggregation logic in `util/papers.ts` or the client search/filter/sort inline
script — behavior preserved, only presentation changes.

### 4.6 Global theme refresh

In `quartz.config.ts`: set header font → `Newsreader`, body → `Source Sans 3`, and
update the light/dark color palette to §3. This applies site-wide (garden pages
included) for cohesion; garden layout/components are otherwise unchanged.

### 4.7 Photo asset

Served from `quartz/static/profile/` (created; → `/static/profile/profile.jpg`).
Hero shows the photo if present, else a "JP" monogram fallback. (A placeholder
`README.md` already documents this path.)

## 5. Data layer

**Location:** repo-root `data/` (tracked by git; **not** under `content/`, which is
the gitignored iCloud vault). Parsed at build with `js-yaml` (already a dependency).
Loader `quartz/util/portfolio.ts` resolves `data/` relative to the repo root, reads
each file, validates shape, and returns typed objects with safe defaults for missing
files. Unit-tested.

### 5.1 Schemas

```yaml
# data/profile.yaml
name: Juhyeon Park
role: Undergraduate Researcher        # see open item 9.1
affiliation:
  lab: { name: DS Lab, url: https://sundong.kim }
  pi: { name: Sundong Kim, url: https://sundong.kim }
  institution: { name: GIST, url: https://www.gist.ac.kr, country: South Korea }
bio: >
  My research centers on human-like AI — drawing on human traits such as a sense of
  self and motivation to shape how AI behaves and is built. Starting from a simple
  question — what makes us human? — I work to translate those traits into the design
  and implementation of intelligent agents.
photo: /static/profile/profile.jpg     # optional; monogram fallback
interests: [Human-like AI, Self & Motivation, Artificial Intelligence,
            Deep Learning, Statistics, Reinforcement Learning, Neuroscience]
contacts:
  - { kind: email, label: juhyeon-park@gm.gist.ac.kr, href: "mailto:juhyeon-park@gm.gist.ac.kr" }
  - { kind: email, label: Gmail, href: "mailto:irregular6612@gmail.com" }
  - { kind: github, label: GitHub, href: https://github.com/irregular6612 }
  - { kind: orcid, label: ORCID, href: "", soon: true }
  - { kind: scholar, label: Scholar, href: "", soon: true }
```

```yaml
# data/news.yaml  (list, newest first)
- { date: 2026, html: "Joined the [DS Lab](https://sundong.kim) at GIST as an undergraduate researcher." }
- { date: 2025, html: "Worked in the Language Cognition and Brain Lab (LCBL)." }
```

```yaml
# data/publications.yaml  (empty [] for now)
# - { year: 2026, title: "...", authors: "...", venue: "...",
#     links: { pdf: "...", code: "...", doi: "..." }, selected: true }
```

```yaml
# data/projects.yaml
- { name: "Generated Face Rating: AI vs. Human", lab: LCBL, desc: "comparison study", url: "" }
- { name: "KE Corpus",            lab: LCBL,  desc: "corpus construction", url: "" }
- { name: "Phonetic Convergence", lab: LCBL,  desc: "speech / cognition",  url: "" }
- { name: "LLM-Squid Game",       lab: DS Lab, desc: "LLM agent benchmark", url: "" }
- { name: "AgentnessArena",       lab: DS Lab, desc: "agent evaluation",    url: "" }
```

```yaml
# data/talks.yaml   -> []   (title, event, date, slides)
# data/awards.yaml  -> []   (title, org, year)
```

```yaml
# data/cv.yaml
pdf: ""                                 # optional /static/cv/...
education:
  - { period: "20XX–present", degree: "B.S.", field: "...", org: "GIST" }
experience:
  - { period: "2026–present", role: "Undergraduate Researcher", org: "DS Lab, GIST", url: https://sundong.kim }
  - { period: "2025–2026",    role: "Undergraduate Researcher", org: "Language Cognition and Brain Lab (LCBL)" }
```

`lab` values map to badge styles (`LCBL` → green, `DS Lab` → navy); unknown labs get
a neutral badge.

## 6. Files — new vs. modified

**New**

| Path | Purpose |
| ---- | ------- |
| `data/*.yaml` (7 files) | Portfolio content (profile, news, publications, projects, talks, awards, cv) |
| `quartz/util/portfolio.ts` | Load + validate + type portfolio data |
| `quartz/util/portfolio.test.ts` | Loader unit tests |
| `quartz/components/TopNav.tsx` | Shared top navigation |
| `quartz/components/pages/Portfolio.tsx` | Landing page body |
| `quartz/components/pages/CV.tsx` | CV page body |
| `quartz/plugins/emitters/academicLanding.tsx` | Emits `/` |
| `quartz/plugins/emitters/cvPage.tsx` | Emits `/cv` |
| `quartz/components/styles/portfolio.scss`, `topnav.scss`, `cv.scss` | Styles |

**Modified**

| Path | Change |
| ---- | ------ |
| `quartz.config.ts` | Fonts + color palette; register `AcademicLanding`, `CVPage` emitters |
| `quartz.layout.ts` | Add `landingLayout`; export TopNav usage |
| `quartz/components/index.ts` | Export `TopNav`, `Portfolio`, `CV` |
| `quartz/components/pages/PapersDashboard.tsx` + its SCSS | Restyle |
| `quartz/plugins/emitters/papersDashboard.tsx` | Use `landingLayout` |
| `content/index.md` | Mark `draft: true` (emitter owns `/`) |

## 7. Styling approach

- Per-component SCSS in `quartz/components/styles/`, attached via each component's
  `css` field (existing Quartz convention).
- Full-width grid: add a `data-portfolio` / body class on landing/CV/dashboard so the
  page grid collapses the empty side columns to full width (override Quartz's grid
  template for these slugs only — scoped, no impact on garden pages).
- All colors via CSS variables already themed by Quartz light/dark, plus a few
  portfolio-specific variables so dark mode is automatic.
- Respect `prefers-reduced-motion`; sticky nav uses `position: sticky`.

## 8. Testing

- `quartz/util/portfolio.test.ts`: valid file parses to typed object; missing file →
  safe empty default; malformed entry → clear error or skipped with warning; lab→badge
  mapping; selected-publications filter.
- `npm run check` (tsc strict + Prettier) passes; no `any`/`@ts-ignore`.
- Build smoke test: `npx quartz build` succeeds; `/`, `/cv`, `/papers` emit; empty
  sections render empty-states; garden pages still build.
- Visual verification via the dev server + screenshots (light & dark) before done.

## 9. Open items (non-blocking; have sensible defaults)

1. **Role label** — defaulting to "Undergraduate Researcher" (alt: "B.S. Student,
   4th year"). One-line change in `data/profile.yaml`.
2. **Photo** — user drops `profile.jpg` into `quartz/static/profile/`; monogram until
   then.
3. **ORCID / Scholar** — "soon" placeholders until IDs provided.
4. **CV PDF & full CV details** (education dates, major) — placeholders in `cv.yaml`.
5. **Project descriptions/links** — current one-liners are placeholders.
6. **"Wiki" nav target** — pick a garden entry page at build.

## 10. Risks & mitigations

- **Global theme change affects all garden pages** → keep palette close to current
  (navy was already the secondary), verify a sample of garden pages in light/dark.
- **`/` slug collision** between `ContentPage` and `AcademicLanding` → resolved by
  marking `content/index.md` as draft; verify only one `/` is emitted.
- **`data/` path resolution in emitter** (cwd vs QUARTZ) → loader resolves explicitly
  from repo root and is unit-tested; fail loudly if `data/` missing.
- **Content lives in iCloud vault (gitignored)** → portfolio data deliberately in
  repo `data/`, never in `content/`.

## 11. Out of scope / future

- ORCID importer for publications (schema already accommodates it).
- Per-project detail pages.
- Animated/interactive hero.
- LLM-wiki Tier-2 work (separate spec).
