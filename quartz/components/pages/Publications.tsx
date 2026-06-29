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
    </div>
  )
}

export default (() => Publications) satisfies QuartzComponentConstructor
