import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import { ConceptRecord, CountBucket } from "../../util/concepts"
// @ts-ignore — Quartz bundles inline scripts as strings at build time
import script from "../scripts/conceptsDashboard.inline"

function maxCount(buckets: CountBucket[]): number {
  return buckets.reduce((m, b) => Math.max(m, b.count), 1)
}

function DomainChart({ buckets }: { buckets: CountBucket[] }) {
  const max = maxCount(buckets)
  return (
    <div class="concepts-chart">
      <div class="concepts-chart-label">분야별 개념 노트</div>
      {buckets.map((b) => (
        <div class="concepts-barrow" key={b.key}>
          <span class="concepts-barrow-key">{b.key}</span>
          <span class="concepts-bar" style={`width:${(b.count / max) * 100}%`}></span>
          <span class="concepts-barrow-count">{b.count}</span>
        </div>
      ))}
    </div>
  )
}

const ConceptsDashboard: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.conceptsData
  if (!data) return <p>No concepts found.</p>
  const { records, aggregate, recent } = data
  const curSlug = fileData.slug!

  const stats: { label: string; value: string }[] = [
    { label: "Concepts", value: String(aggregate.total) },
    { label: "Domains", value: String(aggregate.domainCount) },
    { label: "Reviewed", value: String(aggregate.withReviewCount) },
    { label: "Tagged", value: String(aggregate.taggedCount) },
  ]

  const domains = aggregate.byDomain.map((b) => b.key)
  const href = (r: ConceptRecord) => resolveRelative(curSlug, r.slug as FullSlug)

  return (
    <div id="concepts-dashboard" class="concepts-dashboard portfolio-root">
      {/* 1. stat cards */}
      <div class="concepts-stats">
        {stats.map((s) => (
          <div class="concepts-statcard" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* 2. by-domain chart */}
      <div class="concepts-charts">
        <DomainChart buckets={aggregate.byDomain} />
      </div>

      {/* 3. recently reviewed */}
      {recent.length > 0 && (
        <div class="concepts-recent">
          <div class="concepts-chart-label">▶ 최근 정리한 개념</div>
          <div class="concepts-recent-grid">
            {recent.map((r) => (
              <a class="concepts-recent-card" href={href(r)} key={r.slug}>
                <span class="concepts-recent-title">{r.title}</span>
                <span class="concepts-recent-meta">
                  {r.domain}
                  {r.reviewDate ? ` · ${r.reviewDate}` : ""}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 4. controls + chips + list */}
      <div class="concepts-controls">
        <input
          id="concepts-search"
          class="concepts-search"
          type="text"
          placeholder="제목·주제·태그 검색…"
        />
        <select id="concepts-sort" class="concepts-sort">
          <option value="review">정렬: 정리일 ↓</option>
          <option value="domain">정렬: 분야 ↑</option>
          <option value="title">정렬: 제목 ↑</option>
        </select>
      </div>

      <div class="concepts-chipbar">
        {domains.map((d) => (
          <button class="concepts-chip" data-filter-value={d} key={`d-${d}`}>
            {d}
          </button>
        ))}
      </div>

      <div id="concepts-list" class="concepts-list">
        {records.map((r) => (
          <div
            class="concepts-row"
            key={r.slug}
            data-title={r.title}
            data-topic={r.topic}
            data-domain={r.domain}
            data-tags={r.tags.join(" ")}
            data-review={r.reviewDate ?? ""}
          >
            <a class="concepts-row-title" href={href(r)}>
              {r.title}
            </a>
            <span class="concepts-badge">{r.domain}</span>
            {r.topic !== "—" ? <span class="concepts-topic">{r.topic}</span> : null}
            <span class="concepts-row-date">{r.reviewDate ?? "—"}</span>
          </div>
        ))}
      </div>
      <p id="concepts-empty" class="concepts-empty" style="display:none">
        조건에 맞는 개념이 없습니다.
      </p>
    </div>
  )
}

ConceptsDashboard.css = `
.concepts-dashboard { display: flex; flex-direction: column; gap: 1.2rem; }
.concepts-dashboard h1, #concepts-dashboard { font-family: var(--bodyFont); }
.concepts-stats { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.concepts-statcard { border: 1px solid var(--lightgray); border-radius: 11px; padding: 0.7rem 0.9rem; text-align: center; min-width: 5.5rem; background: var(--light); }
.concepts-statcard b { display: block; font-family: var(--headerFont); font-size: 1.5rem; color: var(--dark); line-height: 1.1; }
.concepts-statcard span { font-size: 0.7rem; color: var(--gray); }
.concepts-charts { display: flex; gap: 0.8rem; flex-wrap: wrap; }
.concepts-chart { flex: 1; min-width: 240px; border: 1px solid var(--lightgray); border-radius: 11px; padding: 0.6rem 0.8rem; }
.concepts-chart-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--darkgray); margin-bottom: 0.4rem; }
.concepts-barrow { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; margin: 0.2rem 0; }
.concepts-barrow-key { width: 9rem; text-align: right; color: var(--darkgray); flex-shrink: 0; }
.concepts-bar { height: 0.55rem; background: linear-gradient(90deg, var(--tertiary), var(--secondary)); border-radius: 4px; min-width: 2px; }
.concepts-barrow-count { color: var(--gray); font-size: 0.7rem; }
.concepts-recent { border: 1px solid var(--lightgray); border-radius: 11px; padding: 0.6rem 0.8rem; background: var(--light); }
.concepts-recent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.4rem; }
.concepts-recent-card { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.5rem; border: 1px solid var(--lightgray); border-radius: 6px; text-decoration: none; background: var(--light); border-left: 3px solid var(--tertiary); }
.concepts-recent-title { font-size: 0.85rem; color: var(--secondary); }
.concepts-recent-meta { font-size: 0.7rem; color: var(--gray); }
.concepts-controls { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.concepts-search { flex: 1; min-width: 12rem; padding: 0.4rem 0.6rem; border: 1px solid var(--lightgray); border-radius: 6px; background: var(--light); color: var(--dark); }
.concepts-sort { padding: 0.4rem; border: 1px solid var(--lightgray); border-radius: 6px; background: var(--light); color: var(--dark); }
.concepts-chipbar { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.concepts-chip { font-size: 0.7rem; padding: 0.15rem 0.55rem; border-radius: 11px; border: 1px solid var(--tertiary); color: var(--secondary); background: transparent; cursor: pointer; }
.concepts-chip.active { background: var(--secondary); color: var(--light); border-color: var(--secondary); }
.concepts-list { display: flex; flex-direction: column; }
.concepts-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.35rem 0; border-bottom: 1px solid var(--lightgray); font-size: 0.8rem; }
.concepts-row-title { flex: 1; color: var(--secondary); text-decoration: none; }
.concepts-badge { font-size: 0.65rem; padding: 0.1rem 0.45rem; border-radius: 9px; background: var(--secondary); color: var(--light); }
.concepts-topic { font-size: 0.65rem; color: var(--darkgray); max-width: 16rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.concepts-row-date { color: var(--gray); width: 6rem; text-align: right; flex-shrink: 0; }
.concepts-empty { color: var(--gray); font-size: 0.85rem; }
`

ConceptsDashboard.afterDOMLoaded = script

export default (() => ConceptsDashboard) satisfies QuartzComponentConstructor
