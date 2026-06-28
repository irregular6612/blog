import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import type { CVEntry } from "../../util/portfolio"

function EntryRow({ e }: { e: CVEntry }) {
  return (
    <div class="cv-row">
      <span class="cv-period">{e.period}</span>
      <span class="cv-main">
        <b>{e.role ?? [e.degree, e.field].filter(Boolean).join(", ")}</b>
        {e.org ? (
          <span class="cv-org"> — {e.url ? <a href={e.url}>{e.org}</a> : e.org}</span>
        ) : null}
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
