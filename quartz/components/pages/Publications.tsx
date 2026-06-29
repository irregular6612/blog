import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import type { Publication } from "../../util/portfolio"

// All publications, newest year first. Reuses the global pf-* styles defined on
// the Portfolio component (emitted into the shared stylesheet).
function allPublications(pubs: Publication[]): Publication[] {
  return pubs.slice().sort((a, b) => b.year - a.year)
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

const Publications: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.portfolioData
  if (!data) return <p>No portfolio data.</p>
  const pubs = allPublications(data.publications)

  return (
    <div class="portfolio-root">
      <section class="pf-hero cv-hero">
        <div class="pf-hero-main">
          <h1 class="pf-name">Publications</h1>
          <p class="pf-role">Peer-reviewed papers, consortium and workshop contributions</p>
        </div>
      </section>

      <section class="pf-section">
        {pubs.length > 0 ? (
          <div class="pf-pubcards">
            {pubs.map((p, idx) => (
              <article class="pf-pubcard" key={idx}>
                <h3 class="pf-pubcard-title">{p.title}</h3>
                <dl class="pf-pubcard-meta">
                  <dt>Authors</dt>
                  <dd class="pf-pubcard-authors">{p.authors}</dd>
                  <dt>Venue</dt>
                  <dd class="pf-pubcard-venue">{p.venue}</dd>
                  <dt>Date</dt>
                  <dd class="pf-pubcard-date">{p.date ?? p.year}</dd>
                </dl>
                <PubLinks p={p} />
              </article>
            ))}
          </div>
        ) : (
          <p class="pf-empty">Publications will appear here soon.</p>
        )}
      </section>
    </div>
  )
}

Publications.css = `
.pf-pubcards { display: flex; flex-direction: column; }
.pf-pubcard { padding: 1rem 0; border-bottom: 1px solid var(--lightgray); }
.pf-pubcard:first-child { padding-top: 0; }
.pf-pubcard-title { font-family: var(--headerFont); font-weight: 600; font-size: 1.12rem; color: var(--dark); line-height: 1.45; margin: 0 0 0.55rem; }
.pf-pubcard-meta { display: grid; grid-template-columns: max-content 1fr; gap: 0.22rem 0.9rem; margin: 0; }
.pf-pubcard-meta dt { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.09em; color: var(--gray); font-weight: 600; padding-top: 0.12rem; }
.pf-pubcard-meta dd { margin: 0; font-size: 0.96rem; color: var(--darkgray); line-height: 1.5; }
.pf-pubcard-venue { font-style: italic; color: var(--secondary); }
.pf-pubcard-date { font-variant-numeric: tabular-nums; }
.pf-pubcard .pf-pub-links { margin-top: 0.55rem; }
@media all and (max-width: 600px) {
  .pf-pubcard-meta { grid-template-columns: 1fr; gap: 0.05rem 0; }
  .pf-pubcard-meta dt { padding-top: 0.4rem; }
}
`

export default (() => Publications) satisfies QuartzComponentConstructor
