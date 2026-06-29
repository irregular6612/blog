import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const Talks: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.portfolioData
  if (!data) return <p>No portfolio data.</p>
  const { talks } = data

  return (
    <div class="portfolio-root">
      <section class="pf-hero cv-hero">
        <div class="pf-hero-main">
          <h1 class="pf-name">Talks</h1>
          <p class="pf-role">Invited talks, presentations, and seminars</p>
        </div>
      </section>

      <section class="pf-section">
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
    </div>
  )
}

export default (() => Talks) satisfies QuartzComponentConstructor
