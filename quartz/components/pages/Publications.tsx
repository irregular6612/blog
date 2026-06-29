import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { publishedProjects } from "../../util/portfolio"
import { ProjectCard } from "./Projects"

// Publications are sourced from projects flagged `published: true` and rendered
// with the same card as the Projects page (title, lab badge, authors, venue,
// abstract toggle, PDF button). The global pf-* styles come from Portfolio.css.
const Publications: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.portfolioData
  if (!data) return <p>No portfolio data.</p>
  const pubs = publishedProjects(data.projects)

  return (
    <div class="portfolio-root">
      <section class="pf-hero cv-hero">
        <div class="pf-hero-main">
          <h1 class="pf-name">Publications</h1>
          <p class="pf-role">Published work — peer-reviewed, consortium, and workshop papers</p>
        </div>
      </section>

      <section class="pf-section">
        {pubs.length > 0 ? (
          <div class="pf-projects">
            {pubs.map((pr, idx) => (
              <ProjectCard pr={pr} key={idx} />
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
