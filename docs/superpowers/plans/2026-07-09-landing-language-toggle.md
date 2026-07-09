# Landing Page KO/EN Language Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a slide switch (KO ⇄ EN) beside the dark-mode button on the landing page's top nav that instantly retranslates all landing-page content between English and Korean.

**Architecture:** Mirror the existing dark-mode idiom. Both languages are rendered into the HTML; a `saved-lang` attribute on `<html>` plus CSS shows only the active language. The choice persists in `localStorage` and is applied before first paint by a `beforeDOMLoaded` inline script (no flash). A new `LangToggle` component (rendered only on the `index` slug) drives it.

**Tech Stack:** TypeScript + Preact (JSX via `jsxImportSource: "preact"`), SCSS, Quartz v4 static build, Node.js native test runner (`node:test`), js-yaml data files.

## Global Constraints

- **No semicolons.** Print width 100, tab width 2, trailing commas. Run `npm run format` before each commit.
- **TypeScript strict:** never use `any` or `@ts-expect-error`. The one allowed exception is `// @ts-ignore` immediately above an `*.inline` script import — this is the established repo pattern (see `Darkmode.tsx:1`); mirror it exactly for the new inline import.
- **`import type`** for type-only imports.
- **Naming:** functions `camelCase`, types `PascalCase`, type guards `is*`, components `PascalCase.tsx`.
- **Default language is English.** First-time visitors (no `localStorage.lang`) see English.
- **Scope: landing (`index`) page only.** The toggle switch renders only when `fileData.slug === "index"`. The `<T>`-wrapped nav labels and the global i18n CSS rules are harmless on other portfolio surfaces and may appear there.
- **Data schema for translatable text is `{ en, ko }`.** A plain string means "identical in both languages" (backward-compatible).
- **Verification gate for every task:** (a) `npm run test` passes; (b) **zero NEW tsc errors** — the repo has 19 pre-existing `tsc --noEmit` errors, all confined to legacy `Bases`/`ContentIndex`/`bases` files (`quartz/components/pages/BasesPage.tsx`, `quartz/plugins/emitters/basesPage.tsx`, `quartz/plugins/emitters/contentIndex.tsx`, `quartz/plugins/transformers/bases.ts`, `quartz/components/scripts/baseTransclude.inline.ts`). Do NOT fix these; just ensure the files you touch introduce no new errors (`npx tsc --noEmit 2>&1 | grep -c "error TS"` must stay at 19, and none of the new errors name a file you changed); (c) `npx prettier --check` clean on changed files (run `npm run format` before committing). Do NOT rely on `npm run check` pass/fail — it always fails on the 19 legacy errors.

---

## File Structure

**Create:**
- `quartz/components/LangText.tsx` — `<T en ko>` helper rendering both-language spans.
- `quartz/components/LangToggle.tsx` — the slide-switch component.
- `quartz/components/scripts/langtoggle.inline.ts` — client script (dark-mode twin).
- `quartz/components/styles/langtoggle.scss` — switch styles + global i18n show/hide rules.

**Modify:**
- `quartz/util/portfolio.ts` — `Localized<T>` type, `localizedPair()` helper, retype `Profile.role/bio/about` and `NewsItem.html`.
- `quartz/util/portfolio.test.ts` — tests for `localizedPair`.
- `index.d.ts` — add `langchange` to `CustomEventMap`.
- `quartz/components/index.ts` — export `LangToggle` and `T`.
- `quartz/components/TopNav.tsx` — insert `LangToggle` (index-only), wrap link labels in `<T>`, register resources.
- `quartz/components/pages/Portfolio.tsx` — localize labels + profile/news rendering.
- `quartz/components/pages/Projects.tsx` — add `i18n-en`/`i18n-ko` classes to the abstract blocks in `ProjectCard`.
- `quartz/components/pages/CV.tsx` — render `profile.role` through `<T>` (type ripples from the retype).
- `data/profile.yaml` — `role/bio/about` → `{ en, ko }`.
- `data/news.yaml` — each `html` → `{ en, ko }`.

---

## Task 1: Localized data type + resolver helper

**Files:**
- Modify: `quartz/util/portfolio.ts`
- Test: `quartz/util/portfolio.test.ts`

**Interfaces:**
- Produces:
  - `type Localized<T> = T | { en: T; ko: T }`
  - `function localizedPair(v: Localized<string>): { en: string; ko: string }`
  - Retyped fields: `Profile.role: Localized<string>`, `Profile.bio: Localized<string>`, `Profile.about?: Localized<string>`, `NewsItem.html: Localized<string>`.

- [ ] **Step 1: Write the failing test**

Append to `quartz/util/portfolio.test.ts`:

```typescript
describe("localizedPair", () => {
  test("wraps a plain string as identical en/ko", () => {
    assert.deepEqual(localizedPair("hello"), { en: "hello", ko: "hello" })
  })
  test("passes an { en, ko } object through unchanged", () => {
    assert.deepEqual(localizedPair({ en: "Researcher", ko: "연구생" }), {
      en: "Researcher",
      ko: "연구생",
    })
  })
})
```

And extend the import on line 6 to include the new helper:

```typescript
import {
  loadPortfolio,
  selectedPublications,
  labBadgeClass,
  projectsByYear,
  localizedPair,
} from "./portfolio"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test quartz/util/portfolio.test.ts`
Expected: FAIL — `localizedPair` is not exported / not a function.

- [ ] **Step 3: Add the type and helper**

In `quartz/util/portfolio.ts`, add near the top (after the imports, before `interface Contact`):

```typescript
// A translatable string. A plain string means "identical in both languages";
// an { en, ko } object carries the two variants. Both are always rendered into
// the HTML — the active one is shown via the `saved-lang` attribute + CSS.
export type Localized<T> = T | { en: T; ko: T }

export function localizedPair(v: Localized<string>): { en: string; ko: string } {
  return typeof v === "string" ? { en: v, ko: v } : v
}
```

Then retype the interface fields:
- `Profile.role` → `role: Localized<string>`
- `Profile.bio` → `bio: Localized<string>`
- `Profile.about?` → `about?: Localized<string>`
- `NewsItem.html` → `html: Localized<string>`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test quartz/util/portfolio.test.ts`
Expected: PASS (all describe blocks, including `localizedPair`).

- [ ] **Step 5: Commit**

```bash
npm run format
git add quartz/util/portfolio.ts quartz/util/portfolio.test.ts
git commit -m "feat(portfolio): add Localized type and localizedPair helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `<T>` bilingual text helper component

**Files:**
- Create: `quartz/components/LangText.tsx`
- Modify: `quartz/components/index.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `T`, a plain Preact function component (NOT a `QuartzComponentConstructor`) — `function T({ en, ko }: { en: string; ko: string }): JSX.Element`. Renders `<span class="i18n-en">{en}</span><span class="i18n-ko">{ko}</span>`. Exported as a named export `T` from `quartz/components/index.ts`.

- [ ] **Step 1: Create the component**

Create `quartz/components/LangText.tsx`:

```tsx
// Renders both language variants inline; the active one is shown via the
// `saved-lang` attribute on <html> plus the CSS rules in langtoggle.scss.
// This is a plain Preact component (used inside other components), not a
// QuartzComponentConstructor.
export function T({ en, ko }: { en: string; ko: string }) {
  return (
    <>
      <span class="i18n-en">{en}</span>
      <span class="i18n-ko">{ko}</span>
    </>
  )
}
```

- [ ] **Step 2: Export it from the component barrel**

In `quartz/components/index.ts`, add an import after line 34 (`import TopNav from "./TopNav"`):

```typescript
import { T } from "./LangText"
```

And add `T` to the `export { ... }` block (e.g. after `TopNav,`).

- [ ] **Step 3: Verify the project still type-checks**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expect 19; confirm no new error names a file you changed) and `npx prettier --check <changed files>`
Expected: PASS (no type or prettier errors).

- [ ] **Step 4: Commit**

```bash
npm run format
git add quartz/components/LangText.tsx quartz/components/index.ts
git commit -m "feat(components): add T bilingual text helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `langchange` event type + inline toggle script

**Files:**
- Modify: `index.d.ts`
- Create: `quartz/components/scripts/langtoggle.inline.ts`

**Interfaces:**
- Consumes: `CustomEventMap` (global), `window.addCleanup` (global, used across `*.inline.ts`).
- Produces:
  - `CustomEventMap["langchange"]: CustomEvent<{ lang: "en" | "ko" }>`
  - DOM contract: sets `document.documentElement` attribute `saved-lang` to `"en"|"ko"`; reads/writes `localStorage.getItem/setItem("lang", ...)`; on click of any `.langtoggle` element, toggles the language, updates the element's `aria-checked`, and dispatches a `langchange` event.

- [ ] **Step 1: Add the event type**

In `index.d.ts`, add inside `interface CustomEventMap` after the `readermodechange` line:

```typescript
  langchange: CustomEvent<{ lang: "en" | "ko" }>
```

- [ ] **Step 2: Create the inline script**

Create `quartz/components/scripts/langtoggle.inline.ts`:

```typescript
const savedLang = (localStorage.getItem("lang") as "en" | "ko" | null) ?? "en"
document.documentElement.setAttribute("saved-lang", savedLang)

const emitLangChangeEvent = (lang: "en" | "ko") => {
  const event: CustomEventMap["langchange"] = new CustomEvent("langchange", {
    detail: { lang },
  })
  document.dispatchEvent(event)
}

const syncToggleState = (lang: "en" | "ko") => {
  for (const toggle of document.getElementsByClassName("langtoggle")) {
    // aria-checked=true means "Korean is active" (the switch is flipped on).
    toggle.setAttribute("aria-checked", lang === "ko" ? "true" : "false")
  }
}

document.addEventListener("nav", () => {
  const current = (document.documentElement.getAttribute("saved-lang") as "en" | "ko") ?? "en"
  syncToggleState(current)

  const switchLang = () => {
    const newLang =
      document.documentElement.getAttribute("saved-lang") === "ko" ? "en" : "ko"
    document.documentElement.setAttribute("saved-lang", newLang)
    localStorage.setItem("lang", newLang)
    syncToggleState(newLang)
    emitLangChangeEvent(newLang)
  }

  for (const toggle of document.getElementsByClassName("langtoggle")) {
    toggle.addEventListener("click", switchLang)
    window.addCleanup(() => toggle.removeEventListener("click", switchLang))
  }
})
```

- [ ] **Step 3: Verify type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expect 19; confirm no new error names a file you changed) and `npx prettier --check <changed files>`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
npm run format
git add index.d.ts quartz/components/scripts/langtoggle.inline.ts
git commit -m "feat(scripts): add langchange event and langtoggle inline script

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: LangToggle component + styles

**Files:**
- Create: `quartz/components/LangToggle.tsx`
- Create: `quartz/components/styles/langtoggle.scss`

**Interfaces:**
- Consumes: the inline script from Task 3, `QuartzComponent`/`QuartzComponentConstructor`/`QuartzComponentProps` from `./types`, `classNames` from `../util/lang`.
- Produces: default export `() => LangToggle satisfies QuartzComponentConstructor`, with `LangToggle.beforeDOMLoaded = langToggleScript` and `LangToggle.css = styles`. Root element has `class="langtoggle"` (+ `displayClass`), `role="switch"`, `aria-checked="false"`, `aria-label`, `tabIndex={0}`.

- [ ] **Step 1: Create the component**

Create `quartz/components/LangToggle.tsx` (the `// @ts-ignore` above the inline import is the sanctioned repo pattern — see `Darkmode.tsx:1`):

```tsx
// @ts-ignore
import langToggleScript from "./scripts/langtoggle.inline"
import styles from "./styles/langtoggle.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const LangToggle: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <button
      class={classNames(displayClass, "langtoggle")}
      role="switch"
      aria-checked="false"
      aria-label="Toggle language between English and Korean"
      tabIndex={0}
    >
      <span class="langtoggle-label langtoggle-ko" aria-hidden="true">
        KO
      </span>
      <span class="langtoggle-track" aria-hidden="true">
        <span class="langtoggle-knob"></span>
      </span>
      <span class="langtoggle-label langtoggle-en" aria-hidden="true">
        EN
      </span>
    </button>
  )
}

LangToggle.beforeDOMLoaded = langToggleScript
LangToggle.css = styles

export default (() => LangToggle) satisfies QuartzComponentConstructor
```

- [ ] **Step 2: Create the styles + global i18n rules**

Create `quartz/components/styles/langtoggle.scss`:

```scss
// --- Global language show/hide (both variants are always in the DOM) ---
// Default (attribute unset) shows English.
html .i18n-ko {
  display: none;
}
html[saved-lang="ko"] .i18n-ko {
  display: revert;
}
html[saved-lang="ko"] .i18n-en {
  display: none;
}

// --- The slide switch ---
.langtoggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--gray);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  user-select: none;

  & .langtoggle-track {
    position: relative;
    width: 2.1rem;
    height: 1.1rem;
    border-radius: 999px;
    background: var(--lightgray);
    transition: background 0.2s ease;
    flex: 0 0 auto;
  }

  & .langtoggle-knob {
    position: absolute;
    top: 0.15rem;
    left: 0.15rem;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: var(--light);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s ease;
  }

  // Active-language label gets emphasis.
  & .langtoggle-en {
    color: var(--secondary);
  }
  & .langtoggle-ko {
    color: var(--gray);
  }

  &[aria-checked="true"] {
    & .langtoggle-track {
      background: var(--secondary);
    }
    & .langtoggle-knob {
      transform: translateX(1rem);
    }
    & .langtoggle-en {
      color: var(--gray);
    }
    & .langtoggle-ko {
      color: var(--secondary);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--secondary);
    outline-offset: 2px;
  }
}
```

- [ ] **Step 3: Verify type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expect 19; confirm no new error names a file you changed) and `npx prettier --check <changed files>`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
npm run format
git add quartz/components/LangToggle.tsx quartz/components/styles/langtoggle.scss
git commit -m "feat(components): add LangToggle slide switch and i18n styles

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Wire LangToggle into TopNav + translate nav labels

**Files:**
- Modify: `quartz/components/TopNav.tsx`

**Interfaces:**
- Consumes: `LangToggle` (default import), `T` (from `./LangText`), the existing `DarkmodeInner` pattern.
- Produces: TopNav renders `LangToggleInner` immediately before `DarkmodeInner`, but only when `props.fileData.slug === "index"`. Nav link labels render through `<T>`. `LangToggleInner.css` is concatenated into `TopNav.css`; its `beforeDOMLoaded` is chained onto `TopNav.beforeDOMLoaded`.

- [ ] **Step 1: Import LangToggle, T, and instantiate**

In `quartz/components/TopNav.tsx`, after line 4 (`import Darkmode from "./Darkmode"`) add:

```tsx
import LangToggle from "./LangToggle"
import { T } from "./LangText"
```

After line 6 (`const DarkmodeInner = Darkmode()`) add:

```tsx
const LangToggleInner = LangToggle()
```

- [ ] **Step 2: Add Korean labels to the LINKS data**

Replace the `NavLink` interface's `label` usage by adding a `labelKo` field. Change the interface (lines 8-20) `label: string` to keep `label` and add `labelKo`:

```tsx
interface NavLink {
  label: string
  labelKo: string
  target: FullSlug
  anchor?: string
  folder?: boolean
  children?: NavLink[]
}
```

Replace the `LINKS` array (lines 24-39) with:

```tsx
const LINKS: NavLink[] = [
  { label: "CV", labelKo: "이력서", target: "cv" as FullSlug },
  { label: "Publications", labelKo: "논문", target: "publications" as FullSlug },
  { label: "Projects", labelKo: "프로젝트", target: "projects" as FullSlug },
  { label: "Talks", labelKo: "발표", target: "talks" as FullSlug },
  { label: "Awards", labelKo: "수상", target: "awards" as FullSlug },
  {
    label: "Wiki",
    labelKo: "위키",
    target: "AI" as FullSlug,
    folder: true,
    children: [
      { label: "Papers", labelKo: "논문", target: "papers" as FullSlug },
      { label: "Concepts", labelKo: "개념", target: "concepts" as FullSlug },
    ],
  },
]
```

- [ ] **Step 3: Render labels through `<T>` and add the toggle**

In the `TopNav` component body (lines 41-76), add the slug/home lines already present, then:

Replace the parent link label render (line 55-56):

```tsx
              <a class="topnav-link topnav-parent" href={hrefOf(l)}>
                <T en={l.label} ko={l.labelKo} /> <span class="topnav-caret">▾</span>
              </a>
```

Replace the dropdown child link (lines 59-61):

```tsx
                  <a class="topnav-dropdown-link" key={c.label} href={hrefOf(c)}>
                    <T en={c.label} ko={c.labelKo} />
                  </a>
```

Replace the plain link (lines 66-69):

```tsx
            <a class="topnav-link" key={l.label} href={hrefOf(l)}>
              <T en={l.label} ko={l.labelKo} />
            </a>
```

Replace the darkmode render (line 72) with the toggle (index-only) placed before darkmode:

```tsx
        {slug === "index" && <LangToggleInner {...props} />}
        <DarkmodeInner {...props} />
```

- [ ] **Step 4: Register LangToggle resources**

Replace the `TopNav.css = concatenateResources(...)` closing (line 137 `DarkmodeInner.css,`) so both are included:

```tsx
  DarkmodeInner.css,
  LangToggleInner.css,
)
```

Replace lines 139-140:

```tsx
TopNav.beforeDOMLoaded = concatenateResources(
  DarkmodeInner.beforeDOMLoaded,
  LangToggleInner.beforeDOMLoaded,
)
TopNav.afterDOMLoaded = DarkmodeInner.afterDOMLoaded
```

(Note: `concatenateResources` is already imported on line 3. It accepts string/undefined args and joins them; passing the two `beforeDOMLoaded` scripts concatenates both inline scripts.)

- [ ] **Step 5: Verify type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expect 19; confirm no new error names a file you changed) and `npx prettier --check <changed files>`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
npm run format
git add quartz/components/TopNav.tsx
git commit -m "feat(topnav): render LangToggle on landing and translate nav labels

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Localize Portfolio content, CV role, and project abstracts

**Files:**
- Modify: `quartz/components/pages/Portfolio.tsx`
- Modify: `quartz/components/pages/CV.tsx`
- Modify: `quartz/components/pages/Projects.tsx`

**Interfaces:**
- Consumes: `T` and `localizedPair`.
- Produces: no new exports; Portfolio/CV render localized profile fields; `ProjectCard` abstract blocks carry `i18n-en`/`i18n-ko` classes.

- [ ] **Step 1: Import helpers in Portfolio**

In `quartz/components/pages/Portfolio.tsx`, extend the portfolio import (line 3) and add the T import:

```tsx
import { publishedProjects, localizedPair } from "../../util/portfolio"
import { T } from "../LangText"
```

- [ ] **Step 2: Localize the hero profile fields**

Replace line 105:

```tsx
          <p class="pf-role">
            <T {...localizedPair(profile.role)} />
          </p>
```

Replace lines 123-124:

```tsx
          <p class="pf-bio">
            <T {...localizedPair(profile.bio)} />
          </p>
          {profile.about && (
            <p class="pf-bio-about">
              <T {...localizedPair(profile.about)} />
            </p>
          )}
```

- [ ] **Step 3: Localize the contact card label and "soon" suffix**

Replace line 128 (`<h2 class="pf-label">Contact</h2>`):

```tsx
            <h2 class="pf-label">
              <T en="Contact" ko="연락처" />
            </h2>
```

Replace the soon row (lines 132-135) inner text so `— soon` translates:

```tsx
                  <span class="pf-contactrow pf-soon" key={c.label}>
                    <ContactIcon kind={c.kind} />
                    <span>
                      {c.label} — <T en="soon" ko="준비 중" />
                    </span>
                  </span>
```

- [ ] **Step 4: Localize the section labels**

Replace the Research Interests label (line 155):

```tsx
        <h2 class="pf-label">
          <T en="Research Interests" ko="연구 관심사" />
        </h2>
```

Replace the News label (line 167):

```tsx
          <h2 class="pf-label">
            <T en="News" ko="소식" />
          </h2>
```

- [ ] **Step 5: Localize the news rows (dangerouslySetInnerHTML, both variants)**

Replace the news row map (lines 169-175). Because each `html` is now `Localized<string>` and contains markup, render two spans, each with its own `dangerouslySetInnerHTML`:

```tsx
            {news.map((n, idx) => {
              const html = localizedPair(n.html)
              return (
                <div class="pf-news-row" key={idx}>
                  <span class="pf-news-date">{n.date}</span>
                  <span class="pf-news-text">
                    <span class="i18n-en" dangerouslySetInnerHTML={{ __html: html.en }} />
                    <span class="i18n-ko" dangerouslySetInnerHTML={{ __html: html.ko }} />
                  </span>
                </div>
              )
            })}
```

- [ ] **Step 6: Localize Selected Publications header + see-all + empty state**

Replace the Selected Publications label (line 181):

```tsx
          <h2 class="pf-label">
            <T en="Selected Publications" ko="주요 논문" />
          </h2>
```

Replace the see-all link text (lines 183-185):

```tsx
            <a class="pf-seeall" href={publicationsHref}>
              <T en="All publications →" ko="전체 논문 →" />
            </a>
```

Replace the empty state (line 195):

```tsx
          <p class="pf-empty">
            <T en="Publications will appear here soon." ko="논문이 곧 여기에 올라옵니다." />
          </p>
```

- [ ] **Step 7: Localize the Explore section + cards**

Replace the Explore label (line 200):

```tsx
        <h2 class="pf-label">
          <T en="Explore" ko="둘러보기" />
        </h2>
```

Replace the five cards (lines 202-221):

```tsx
          <a class="pf-card" href={publicationsHref}>
            <h3>
              📄 <T en="Publications →" ko="논문 →" />
            </h3>
            <p>
              <T
                en="The full list of publications, including consortium and workshop papers."
                ko="컨소시엄·워크숍 논문을 포함한 전체 논문 목록입니다."
              />
            </p>
          </a>
          <a class="pf-card" href={talksHref}>
            <h3>
              🎤 <T en="Talks →" ko="발표 →" />
            </h3>
            <p>
              <T
                en="Invited talks, conference presentations, and seminar slides."
                ko="초청 강연, 학회 발표, 세미나 슬라이드입니다."
              />
            </p>
          </a>
          <a class="pf-card" href={awardsHref}>
            <h3>
              🏆 <T en="Awards →" ko="수상 →" />
            </h3>
            <p>
              <T
                en="Honors, scholarships, and competition results."
                ko="수상, 장학금, 대회 결과입니다."
              />
            </p>
          </a>
          <a class="pf-card" href={papersHref}>
            <h3>
              📚 <T en="Paper Dashboard →" ko="논문 대시보드 →" />
            </h3>
            <p>
              <T
                en="An interactive dashboard of paper reviews — searchable and filterable."
                ko="검색과 필터가 가능한 인터랙티브 논문 리뷰 대시보드입니다."
              />
            </p>
          </a>
          <a class="pf-card" href={wikiHref}>
            <h3>
              🧠 <T en="Knowledge Wiki →" ko="지식 위키 →" />
            </h3>
            <p>
              <T
                en="My digital garden of linked notes, maintained as an LLM-curated wiki."
                ko="LLM이 큐레이션하는 위키로 관리하는, 서로 연결된 노트들의 디지털 가든입니다."
              />
            </p>
          </a>
```

- [ ] **Step 8: Fix CV.tsx role render (type ripple)**

In `quartz/components/pages/CV.tsx`, add the imports (place with the existing imports at the top):

```tsx
import { localizedPair } from "../../util/portfolio"
import { T } from "../LangText"
```

Replace line 28 (`<p class="pf-role">{profile.role}</p>`):

```tsx
          <p class="pf-role">
            <T {...localizedPair(profile.role)} />
          </p>
```

(Leave line 9 `e.role` untouched — that is `CVEntry.role`, a different field.)

- [ ] **Step 9: Add i18n classes to ProjectCard abstract blocks**

In `quartz/components/pages/Projects.tsx`, in `ProjectCard`, replace the two abstract blocks so each responds to the toggle. Change the Korean block wrapper `class="pf-abstract-block"` → `class="pf-abstract-block i18n-ko"` and the English block wrapper `class="pf-abstract-block"` → `class="pf-abstract-block i18n-en"`:

```tsx
              {pr.abstractKo && (
                <div class="pf-abstract-block i18n-ko">
                  <span class="pf-abstract-lang">한국어</span>
                  <p>{pr.abstractKo}</p>
                </div>
              )}
              {pr.abstractEn && (
                <div class="pf-abstract-block i18n-en">
                  <span class="pf-abstract-lang">English</span>
                  <p>{pr.abstractEn}</p>
                </div>
              )}
```

- [ ] **Step 10: Verify type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expect 19; confirm no new error names a file you changed) and `npx prettier --check <changed files>`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
npm run format
git add quartz/components/pages/Portfolio.tsx quartz/components/pages/CV.tsx quartz/components/pages/Projects.tsx
git commit -m "feat(portfolio): localize landing labels, profile fields, and abstracts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Add Korean translations to the data files

**Files:**
- Modify: `data/profile.yaml`
- Modify: `data/news.yaml`

**Interfaces:**
- Consumes: `Localized<string>` schema (`{ en, ko }`) from Task 1.
- Produces: `profile.role/bio/about` and every `news[].html` carry `{ en, ko }`.

- [ ] **Step 1: Convert profile.yaml role/bio/about to { en, ko }**

In `data/profile.yaml`, replace the `role`, `bio`, and `about` blocks (lines 2, 7-18) with:

```yaml
role:
  en: Undergraduate Researcher
  ko: 학부 연구생
bio:
  en: >
    I want to build AI that feels a bit more human. I keep asking myself one question. What
    makes us human?
  ko: >
    저는 조금 더 인간적인 AI를 만들고 싶습니다. 그래서 스스로에게 한 가지 질문을 계속 던집니다.
    무엇이 우리를 인간으로 만드는가?
about:
  en: >
    Can an AI act like it has its own self and its own wants, and not just answer questions
    well? Right now, most AI research is about
    getting more answers right. But being right is not enough to build the kind of
    human-like AI I dream about. Think about how people act. When we get something wrong, we
    change our guess and try again. We keep working toward a goal even when nobody tells us
    to. I want to study these very human habits, like having a sense of who you are, feeling
    motivated, and wanting things. And I want to find clear ways to measure them, so AI
    research can test them too.
  ko: >
    AI가 단지 질문에 잘 답하는 것을 넘어, 자기 자신과 자신만의 욕구를 가진 것처럼 행동할 수
    있을까요? 지금의 AI 연구는 대부분 더 많은 답을 맞히는 데 초점이 맞춰져 있습니다. 하지만 제가
    꿈꾸는 인간적인 AI를 만들기에는 정답을 맞히는 것만으로는 충분하지 않습니다. 사람의 행동을
    떠올려 보세요. 우리는 무언가를 틀리면 생각을 바꿔 다시 시도합니다. 아무도 시키지 않아도 목표를
    향해 계속 나아갑니다. 저는 자기 자신에 대한 감각, 동기, 그리고 무언가를 원하는 마음 같은 지극히
    인간적인 습성을 연구하고 싶습니다. 그리고 AI 연구도 그것들을 검증할 수 있도록, 이를 명확하게
    측정하는 방법을 찾고 싶습니다.
```

(Leave `name`, `affiliation`, `interests`, `contacts` as-is — proper nouns / technical terms stay identical in both languages.)

- [ ] **Step 2: Convert news.yaml html to { en, ko }**

Replace the entire `data/news.yaml` with:

```yaml
- date: 2026
  html:
    en: "Joined the <a href='https://sundong.kim'>DS Lab</a> at GIST as an undergraduate researcher."
    ko: "GIST <a href='https://sundong.kim'>DS Lab</a>에 학부 연구생으로 합류했습니다."
- date: 2025
  html:
    en: "Joined the <a href='https://lcbl.gist.ac.kr/lcbl/index.do'>LCBL</a> (<a href='http://ccle.gist.ac.kr'>Language Cognition and Brain Lab</a>) at GIST as an undergraduate researcher."
    ko: "GIST <a href='https://lcbl.gist.ac.kr/lcbl/index.do'>LCBL</a> (<a href='http://ccle.gist.ac.kr'>Language Cognition and Brain Lab</a>)에 학부 연구생으로 합류했습니다."
- date: 2021
  html:
    en: "Entered GIST as an undergraduate student."
    ko: "GIST 학부생으로 입학했습니다."
```

- [ ] **Step 3: Verify the data loads and type-checks**

Run: `npx tsx --test quartz/util/portfolio.test.ts` and `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expect 19)
Expected: PASS (data files parse; types are satisfied).

- [ ] **Step 4: Commit**

```bash
npm run format
git add data/profile.yaml data/news.yaml
git commit -m "content(portfolio): add Korean translations for landing profile and news

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Build smoke test + manual verification

**Files:** none (verification only)

- [ ] **Step 1: Full build**

Run: `npx quartz build`
Expected: build completes without error; `public/index.html` is produced.

- [ ] **Step 2: Assert both language variants and the toggle are in the output**

Run:

```bash
grep -c 'i18n-ko' public/index.html
grep -c 'i18n-en' public/index.html
grep -c 'langtoggle' public/index.html
grep -c 'saved-lang' public/index.html
```

Expected: `i18n-ko` and `i18n-en` counts are > 0 and equal to each other; `langtoggle` > 0 (switch + inline script present); `saved-lang` > 0 (inline script sets the attribute).

- [ ] **Step 3: Assert the toggle is absent on a non-index portfolio page**

Run:

```bash
grep -c 'class="langtoggle"' public/cv.html || true
```

Expected: `0` — the switch renders only on the landing page (the inline script may still be bundled via TopNav, but the button element is index-only).

- [ ] **Step 4: Manual browser check**

Run: `npx quartz build --serve`, open the landing page, and confirm:
- Default load shows English (fresh session / cleared `localStorage`).
- Clicking the slide switch flips it (knob slides, KO/EN emphasis swaps) and all landing text (role, bio, about, News, section labels, Explore cards, nav labels, project abstracts) switches to Korean with no page reload.
- Reloading keeps the chosen language (persisted in `localStorage`).
- Dark-mode toggle still works independently of the language toggle.
- No first-paint flash of the wrong language.

- [ ] **Step 5: Final format + commit**

```bash
npm run format
git add -A
git commit -m "chore: verify landing language toggle build

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Spec coverage:** Architecture (Task 3/4), LangToggle component (Task 4), inline script (Task 3), langtoggle.scss + i18n rules (Task 4), `<T>` helper (Task 2), data schema `Localized`/`localizedPair` (Task 1), profile/news translations (Task 7), Portfolio + TopNav + ProjectCard localization (Tasks 5-6), CV type ripple (Task 6), edge cases: FOUC (Task 3 beforeDOMLoaded), SPA nav (Task 3 nav listener), a11y `role="switch"`/`aria-checked`/focus (Task 4), toggle index-only (Task 5), verification incl. SEO dual-render presence (Task 8). All spec sections map to a task.
- **Type consistency:** `Localized<string>` and `localizedPair` defined in Task 1 are consumed with the exact same names in Tasks 6-7; `T` prop shape `{ en, ko }` is identical across Tasks 2, 5, 6; `saved-lang` / `localStorage "lang"` / `langtoggle` class / `langchange` event names match across Tasks 3, 4, 5, 8.
- **No placeholders:** every code step contains full literal content.
