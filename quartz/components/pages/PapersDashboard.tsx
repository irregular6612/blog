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
        aggregate.yearMin && aggregate.yearMax ? `${aggregate.yearMin}–${aggregate.yearMax}` : "—",
    },
  ]

  const presentCategories = TOP_CATEGORIES.filter((c) => records.some((r) => r.category === c))
  if (records.some((r) => r.category === "Other")) presentCategories.push("Other" as never)

  const href = (r: PaperRecord) => resolveRelative(curSlug, r.slug as FullSlug)

  return (
    <div id="papers-dashboard" class="papers-dashboard portfolio-root">
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
          <button
            class="papers-chip"
            data-filter-group="category"
            data-filter-value={c}
            key={`c-${c}`}
          >
            {c}
          </button>
        ))}
        {STATUS_VALUES.map((s) => (
          <button
            class="papers-chip"
            data-filter-group="status"
            data-filter-value={s}
            key={`s-${s}`}
          >
            {s}
          </button>
        ))}
        {EVIDENCE_VALUES.map((e) => (
          <button
            class="papers-chip"
            data-filter-group="evidence"
            data-filter-value={e}
            key={`e-${e}`}
          >
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
.papers-dashboard h1, #papers-dashboard { font-family: var(--bodyFont); }
.papers-stats { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.papers-statcard { border: 1px solid var(--lightgray); border-radius: 11px; padding: 0.7rem 0.9rem; text-align: center; min-width: 5.5rem; background: var(--light); }
.papers-statcard b { display: block; font-family: var(--headerFont); font-size: 1.5rem; color: var(--dark); line-height: 1.1; }
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
.papers-bar { height: 0.55rem; background: linear-gradient(90deg, var(--tertiary), var(--secondary)); border-radius: 4px; min-width: 2px; }
.papers-barrow-count { color: var(--gray); font-size: 0.7rem; }
.papers-spotlight {
  border: 1px solid var(--lightgray); border-radius: 8px; padding: 0.6rem 0.8rem; background: var(--light);
}
.papers-spotlight-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.4rem; }
.papers-spot-card {
  display: flex; flex-direction: column; gap: 0.2rem; padding: 0.5rem;
  border: 1px solid var(--lightgray); border-radius: 6px; text-decoration: none; background: var(--light);
  border-left: 3px solid var(--tertiary);
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
  border-bottom: 1px solid var(--lightgray); font-size: 0.8rem; border-left: 3px solid transparent;
}
.papers-row-title { flex: 1; color: var(--secondary); text-decoration: none; }
.papers-row-year { color: var(--gray); width: 3rem; text-align: right; }
.papers-badge { font-size: 0.65rem; padding: 0.1rem 0.45rem; border-radius: 9px; background: var(--secondary); color: var(--light); }
.papers-chiptag { font-size: 0.65rem; padding: 0.1rem 0.45rem; border-radius: 9px; border: 1px solid var(--tertiary); color: var(--darkgray); }
.papers-arxiv { font-size: 0.7rem; color: var(--tertiary); }
.papers-arxiv-empty { font-size: 0.7rem; color: var(--lightgray); }
.papers-empty { color: var(--gray); font-size: 0.85rem; }
.papers-chart { border-radius: 11px; }
.papers-spotlight { border-radius: 11px; }
.papers-chip.active { background: var(--secondary); color: var(--light); border-color: var(--secondary); }
`

PapersDashboard.afterDOMLoaded = script

export default (() => PapersDashboard) satisfies QuartzComponentConstructor
