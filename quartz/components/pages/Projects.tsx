import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { labBadgeClass, projectsByYear } from "../../util/portfolio"
import type { Project } from "../../util/portfolio"

function ProjectCard({ pr }: { pr: Project }) {
  return (
    <div class="pf-project">
      <div class="pf-project-head">
        <span class="pf-project-name">{pr.name}</span>
        <span class={`pf-badge ${labBadgeClass(pr.lab)}`}>{pr.lab}</span>
      </div>
      {pr.authors && <p class="pf-project-authors">{pr.authors}</p>}
      {pr.venue && <p class="pf-project-venue">{pr.venue}</p>}
      {pr.desc && <p class="pf-project-desc">{pr.desc}</p>}
      <div class="pf-project-actions">
        {(pr.abstractKo || pr.abstractEn) && (
          <details class="pf-abstract">
            <summary class="pf-btn">Abstract</summary>
            <div class="pf-abstract-body">
              {pr.abstractKo && (
                <div class="pf-abstract-block">
                  <span class="pf-abstract-lang">한국어</span>
                  <p>{pr.abstractKo}</p>
                </div>
              )}
              {pr.abstractEn && (
                <div class="pf-abstract-block">
                  <span class="pf-abstract-lang">English</span>
                  <p>{pr.abstractEn}</p>
                </div>
              )}
            </div>
          </details>
        )}
        {pr.paper ? (
          <a class="pf-btn" href={pr.paper} target="_blank" rel="noopener noreferrer">
            PDF
          </a>
        ) : (
          <span class="pf-btn pf-btn-disabled" aria-disabled="true" title="Coming soon">
            PDF
          </span>
        )}
      </div>
    </div>
  )
}

const Projects: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.portfolioData
  if (!data) return <p>No portfolio data.</p>
  const groups = projectsByYear(data.projects)

  return (
    <div class="portfolio-root">
      <section class="pf-hero cv-hero">
        <div class="pf-hero-main">
          <h1 class="pf-name">Projects</h1>
          <p class="pf-role">Research projects by year</p>
        </div>
      </section>

      {groups.length > 0 ? (
        groups.map((g) => (
          <section class="pf-section" key={g.year}>
            <h2 class="pf-year">{g.year || "Other"}</h2>
            <div class="pf-projects">
              {g.items.map((pr, idx) => (
                <ProjectCard pr={pr} key={idx} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <p class="pf-empty">No projects yet.</p>
      )}
    </div>
  )
}

Projects.css = `
.pf-year { font-family: var(--headerFont); font-weight: 600; font-size: 1.45rem; color: var(--dark); margin: 0 0 0.8rem; }
`

export default (() => Projects) satisfies QuartzComponentConstructor
