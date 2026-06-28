import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { resolveRelative, FullSlug } from "../../util/path"
import { selectedPublications, labBadgeClass } from "../../util/portfolio"
import type { Publication } from "../../util/portfolio"

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
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

const Portfolio: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.portfolioData
  if (!data) return <p>No portfolio data.</p>
  const { profile, news, publications, projects, talks, awards } = data
  const slug = fileData.slug!
  const aff = profile.affiliation
  const pubs = selectedPublications(publications)
  const papersHref = resolveRelative(slug, "papers" as FullSlug)
  const wikiHref = resolveRelative(slug, "AI" as FullSlug)

  return (
    <div class="portfolio-root">
      <section class="pf-hero">
        {profile.photo ? (
          <img class="pf-photo" src={profile.photo} alt={profile.name} />
        ) : (
          <div class="pf-photo pf-monogram">{monogram(profile.name)}</div>
        )}
        <div class="pf-hero-main">
          <h1 class="pf-name">{profile.name}</h1>
          <p class="pf-role">{profile.role}</p>
          <p class="pf-affil">
            {aff.lab && (aff.lab.url ? <a href={aff.lab.url}>{aff.lab.name}</a> : aff.lab.name)}
            {aff.pi && (
              <> (PI: {aff.pi.url ? <a href={aff.pi.url}>{aff.pi.name}</a> : aff.pi.name})</>
            )}
            {aff.institution && (
              <>
                {" · "}
                {aff.institution.url ? (
                  <a href={aff.institution.url}>{aff.institution.name}</a>
                ) : (
                  aff.institution.name
                )}
                {aff.institution.country ? `, ${aff.institution.country}` : ""}
              </>
            )}
          </p>
          <p class="pf-bio">{profile.bio}</p>
          <div class="pf-contacts">
            {profile.contacts.map((c) =>
              c.soon || !c.href ? (
                <span class="pf-contact pf-soon" key={c.label}>
                  {c.label} — soon
                </span>
              ) : (
                <a
                  class="pf-contact"
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                >
                  {c.label}
                </a>
              ),
            )}
          </div>
        </div>
      </section>

      <section id="about" class="pf-section">
        <h2 class="pf-label">About</h2>
        <p class="pf-text">{profile.about ?? profile.bio}</p>
      </section>

      <section class="pf-section">
        <h2 class="pf-label">Research Interests</h2>
        <div class="pf-chips">
          {profile.interests.map((i) => (
            <span class="pf-chip" key={i}>
              {i}
            </span>
          ))}
        </div>
      </section>

      {news.length > 0 && (
        <section class="pf-section">
          <h2 class="pf-label">News</h2>
          <div class="pf-news">
            {news.map((n, idx) => (
              <div class="pf-news-row" key={idx}>
                <span class="pf-news-date">{n.date}</span>
                <span class="pf-news-text" dangerouslySetInnerHTML={{ __html: n.html }} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="publications" class="pf-section">
        <h2 class="pf-label">Selected Publications</h2>
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

      <section id="projects" class="pf-section">
        <h2 class="pf-label">Projects</h2>
        {projects.length > 0 ? (
          <div class="pf-projects">
            {projects.map((pr, idx) => (
              <div class="pf-project" key={idx}>
                <span class="pf-project-name">{pr.name}</span>
                {pr.desc && <span class="pf-project-desc">{pr.desc}</span>}
                <span class={`pf-badge ${labBadgeClass(pr.lab)}`}>{pr.lab}</span>
              </div>
            ))}
          </div>
        ) : (
          <p class="pf-empty">No projects yet.</p>
        )}
      </section>

      <section class="pf-section">
        <h2 class="pf-label">Talks</h2>
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

      <section class="pf-section">
        <h2 class="pf-label">Awards</h2>
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

      <section class="pf-section">
        <h2 class="pf-label">Explore</h2>
        <div class="pf-explore">
          <a class="pf-card" href={papersHref}>
            <h3>📚 Research Papers →</h3>
            <p>An interactive dashboard of paper reviews — searchable and filterable.</p>
          </a>
          <a class="pf-card" href={wikiHref}>
            <h3>🧠 Knowledge Wiki →</h3>
            <p>My digital garden of linked notes, maintained as an LLM-curated wiki.</p>
          </a>
        </div>
      </section>
    </div>
  )
}

Portfolio.css = `
.portfolio-root { display: flex; flex-direction: column; }
.pf-hero { display: flex; gap: 1.8rem; align-items: flex-start; margin: 1rem 0 0.5rem; }
.pf-photo { width: 120px; height: 120px; border-radius: 16px; flex: 0 0 auto; object-fit: cover; }
.pf-monogram { background: var(--dark); color: var(--light); display: flex; align-items: center; justify-content: center; font-family: var(--headerFont); font-size: 2.6rem; }
.pf-name { font-family: var(--headerFont); font-weight: 500; font-size: 2.2rem; color: var(--dark); margin: 0 0 0.2rem; }
.pf-role { font-size: 1rem; color: var(--secondary); font-weight: 600; margin: 0 0 0.15rem; }
.pf-affil { font-size: 0.9rem; color: var(--gray); margin: 0 0 0.7rem; }
.pf-bio { font-size: 0.97rem; line-height: 1.6; max-width: 56ch; margin: 0.3rem 0 0.9rem; }
.pf-contacts { display: flex; gap: 0.55rem; flex-wrap: wrap; }
.pf-contact { font-size: 0.8rem; padding: 0.3rem 0.7rem; border-radius: 999px; background: var(--highlight); color: var(--secondary); border: 1px solid var(--lightgray); text-decoration: none; }
.pf-soon { color: var(--gray); }
.pf-section { padding-top: 1.3rem; margin-top: 1.3rem; border-top: 1px solid var(--lightgray); }
.pf-label { font-family: var(--bodyFont); font-size: 0.72rem; letter-spacing: 0.13em; text-transform: uppercase; color: var(--gray); font-weight: 600; margin: 0 0 0.7rem; }
.pf-text { font-size: 0.96rem; line-height: 1.62; max-width: 62ch; margin: 0; }
.pf-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.pf-chip { font-size: 0.85rem; padding: 0.3rem 0.75rem; border-radius: 7px; background: var(--highlight); color: var(--secondary); }
.pf-news { display: flex; flex-direction: column; }
.pf-news-row { display: flex; gap: 0.9rem; font-size: 0.92rem; padding: 0.35rem 0; line-height: 1.5; }
.pf-news-date { color: var(--gray); white-space: nowrap; flex: 0 0 5rem; font-variant-numeric: tabular-nums; }
.pf-news-text a { color: var(--secondary); }
.pf-pubs { display: flex; flex-direction: column; }
.pf-pub { display: flex; gap: 0.9rem; align-items: baseline; padding: 0.5rem 0; border-bottom: 1px dotted var(--lightgray); font-size: 0.9rem; line-height: 1.45; }
.pf-pub-year { color: var(--gray); flex: 0 0 3rem; font-variant-numeric: tabular-nums; }
.pf-pub-main { flex: 1; }
.pf-pub-links { white-space: nowrap; display: flex; gap: 0.5rem; }
.pf-pub-links a { font-size: 0.8rem; color: var(--secondary); }
.pf-projects { display: flex; flex-direction: column; gap: 0.55rem; }
.pf-project { display: flex; align-items: baseline; gap: 0.7rem; padding: 0.55rem 0.85rem; border: 1px solid var(--lightgray); border-radius: 9px; }
.pf-project-name { font-weight: 600; color: var(--dark); font-size: 0.95rem; }
.pf-project-desc { font-size: 0.84rem; color: var(--gray); }
.pf-badge { margin-left: auto; font-size: 0.7rem; padding: 0.18rem 0.55rem; border-radius: 999px; font-weight: 600; white-space: nowrap; }
.pf-badge.lab-lcbl { background: #eaf3ee; color: #2e6b4d; border: 1px solid #d6e8de; }
.pf-badge.lab-ds { background: var(--highlight); color: var(--secondary); border: 1px solid var(--lightgray); }
.pf-badge.lab-other { background: var(--lightgray); color: var(--darkgray); }
.pf-empty { font-size: 0.9rem; color: var(--gray); font-style: italic; }
.pf-explore { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.pf-card { border: 1px solid var(--lightgray); border-radius: 11px; padding: 1rem 1.1rem; text-decoration: none; }
.pf-card h3 { font-family: var(--headerFont); font-weight: 600; color: var(--dark); font-size: 1.05rem; margin: 0 0 0.3rem; }
.pf-card p { margin: 0; font-size: 0.85rem; color: var(--gray); line-height: 1.45; }
@media all and (max-width: 600px) {
  .pf-hero { flex-direction: column; gap: 1rem; }
  .pf-explore { grid-template-columns: 1fr; }
}
`

export default (() => Portfolio) satisfies QuartzComponentConstructor
