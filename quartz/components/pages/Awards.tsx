import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const Awards: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.portfolioData
  if (!data) return <p>No portfolio data.</p>
  const { awards } = data

  return (
    <div class="portfolio-root">
      <section class="pf-hero cv-hero">
        <div class="pf-hero-main">
          <h1 class="pf-name">Awards</h1>
          <p class="pf-role">Honors, scholarships, and competition results</p>
        </div>
      </section>

      <section class="pf-section">
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
    </div>
  )
}

export default (() => Awards) satisfies QuartzComponentConstructor
