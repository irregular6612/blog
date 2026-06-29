import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { resolveRelative, pathToRoot, joinSegments, FullSlug } from "../../util/path"
import { publishedProjects } from "../../util/portfolio"
import { ProjectCard } from "./Projects"

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

// Inline SVG icon per contact kind (16×16, inherits color via currentColor).
function ContactIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "email":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      )
    case "github":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
        </svg>
      )
    case "orcid":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM9.1 7.4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm.9 9.6H8.1V9.3H10v7.7zm6.3 0h-3.4V9.3h3.2c2.3 0 3.6 1.6 3.6 3.8 0 2.4-1.6 3.9-3.4 3.9zm-.2-6.1h-1.3v4.5h1.3c1.4 0 2.3-.9 2.3-2.3 0-1.5-.8-2.2-2.3-2.2z" />
        </svg>
      )
    case "scholar":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M12 4 2 9l10 5 10-5-10-5z" />
          <path d="M6 11.5V16c0 1.1 2.7 2.8 6 2.8s6-1.7 6-2.8v-4.5" />
        </svg>
      )
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
          <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </svg>
      )
  }
}

const Portfolio: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const data = fileData.portfolioData
  if (!data) return <p>No portfolio data.</p>
  const { profile, news } = data
  const slug = fileData.slug!
  const aff = profile.affiliation
  const pubs = publishedProjects(data.projects)
  const papersHref = resolveRelative(slug, "papers" as FullSlug)
  const publicationsHref = resolveRelative(slug, "publications" as FullSlug)
  const talksHref = resolveRelative(slug, "talks" as FullSlug)
  const awardsHref = resolveRelative(slug, "awards" as FullSlug)
  // Trailing slash: "AI" is a folder index. Without it, relative links on the
  // destination (e.g. PageTitle's "..") resolve against the user root and 404.
  const wikiHref = resolveRelative(slug, "AI" as FullSlug) + "/"
  // The photo lives in quartz/static (served at <root>/static/...). Resolve it
  // against the page root so it survives the GitHub Pages "/blog" baseUrl; pass
  // absolute URLs through untouched.
  const photoSrc =
    profile.photo && !/^https?:\/\//.test(profile.photo)
      ? joinSegments(pathToRoot(slug), profile.photo)
      : profile.photo

  return (
    <div class="portfolio-root">
      <section class="pf-hero">
        {photoSrc ? (
          <img class="pf-photo" src={photoSrc} alt={profile.name} />
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
          {profile.about && <p class="pf-bio-about">{profile.about}</p>}
        </div>
        {profile.contacts.length > 0 && (
          <aside class="pf-contactcard">
            <h2 class="pf-label">Contact</h2>
            <div class="pf-contactlist">
              {profile.contacts.map((c) =>
                c.soon || !c.href ? (
                  <span class="pf-contactrow pf-soon" key={c.label}>
                    <ContactIcon kind={c.kind} />
                    <span>{c.label} — soon</span>
                  </span>
                ) : (
                  <a
                    class="pf-contactrow"
                    key={c.label}
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                  >
                    <ContactIcon kind={c.kind} />
                    <span>{c.label}</span>
                  </a>
                ),
              )}
            </div>
          </aside>
        )}
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
        <div class="pf-label-row">
          <h2 class="pf-label">Selected Publications</h2>
          {pubs.length > 0 && (
            <a class="pf-seeall" href={publicationsHref}>
              All publications →
            </a>
          )}
        </div>
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

      <section class="pf-section">
        <h2 class="pf-label">Explore</h2>
        <div class="pf-explore">
          <a class="pf-card" href={publicationsHref}>
            <h3>📄 Publications →</h3>
            <p>The full list of publications, including consortium and workshop papers.</p>
          </a>
          <a class="pf-card" href={talksHref}>
            <h3>🎤 Talks →</h3>
            <p>Invited talks, conference presentations, and seminar slides.</p>
          </a>
          <a class="pf-card" href={awardsHref}>
            <h3>🏆 Awards →</h3>
            <p>Honors, scholarships, and competition results.</p>
          </a>
          <a class="pf-card" href={papersHref}>
            <h3>📚 Paper Dashboard →</h3>
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
.pf-photo { width: 168px; height: 168px; border-radius: 16px; flex: 0 0 auto; object-fit: cover; object-position: 50% 12%; align-self: stretch; min-height: 168px; }
.pf-monogram { background: var(--dark); color: var(--light); display: flex; align-items: center; justify-content: center; font-family: var(--headerFont); font-size: 3.4rem; }
.pf-name { font-family: var(--headerFont); font-weight: 500; font-size: 2.4rem; color: var(--dark); margin: 0 0 0.2rem; }
.pf-role { font-size: 1.1rem; color: var(--secondary); font-weight: 600; margin: 0 0 0.15rem; }
.pf-affil { font-size: 0.98rem; color: var(--gray); margin: 0 0 0.7rem; }
.pf-bio { font-size: 1.08rem; line-height: 1.6; margin: 0.3rem 0 0; }
.pf-bio-about { font-size: 1.02rem; line-height: 1.65; margin: 0.7rem 0 0; color: var(--darkgray); }
.pf-hero-main { flex: 1; min-width: 0; }
.pf-contactcard { flex: 0 0 auto; min-width: 12rem; max-width: 16rem; align-self: stretch; border-left: 1px solid var(--lightgray); padding-left: 1.5rem; }
.pf-contactlist { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.7rem; }
.pf-contactrow { display: inline-flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; color: var(--secondary); text-decoration: none; }
.pf-contactrow svg { width: 17px; height: 17px; flex: 0 0 auto; color: var(--gray); }
.pf-contactrow:hover { color: var(--dark); }
.pf-contactrow:hover svg { color: var(--secondary); }
.pf-soon { color: var(--gray); }
.pf-soon svg { opacity: 0.7; }
.pf-section { padding-top: 1.3rem; margin-top: 1.3rem; border-top: 1px solid var(--lightgray); }
.pf-label { font-family: var(--bodyFont); font-size: 0.76rem; letter-spacing: 0.13em; text-transform: uppercase; color: var(--gray); font-weight: 600; margin: 0 0 0.7rem; }
.pf-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.pf-chip { font-size: 0.92rem; padding: 0.32rem 0.8rem; border-radius: 7px; background: var(--highlight); color: var(--secondary); }
.pf-news { display: flex; flex-direction: column; }
.pf-news-row { display: flex; gap: 0.9rem; font-size: 1rem; padding: 0.38rem 0; line-height: 1.55; }
.pf-news-date { color: var(--gray); white-space: nowrap; flex: 0 0 5rem; font-variant-numeric: tabular-nums; }
.pf-news-text a { color: var(--secondary); }
.pf-pubs { display: flex; flex-direction: column; }
.pf-pub { display: flex; gap: 0.9rem; align-items: baseline; padding: 0.5rem 0; border-bottom: 1px dotted var(--lightgray); font-size: 0.98rem; line-height: 1.5; }
.pf-pub-year { color: var(--gray); flex: 0 0 3rem; font-variant-numeric: tabular-nums; }
.pf-pub-main { flex: 1; }
.pf-pub-links { white-space: nowrap; display: flex; gap: 0.5rem; }
.pf-pub-links a { font-size: 0.86rem; color: var(--secondary); }
.pf-projects { display: flex; flex-direction: column; gap: 0.6rem; }
.pf-project { display: flex; flex-direction: column; gap: 0.32rem; padding: 0.8rem 1rem; border: 1px solid var(--lightgray); border-radius: 9px; }
.pf-project-head { display: flex; align-items: baseline; gap: 0.7rem; }
.pf-project-name { font-weight: 600; color: var(--dark); font-size: 1.06rem; line-height: 1.45; }
.pf-project-authors { font-size: 0.9rem; color: var(--darkgray); margin: 0; }
.pf-project-venue { font-size: 0.86rem; color: var(--secondary); font-style: italic; margin: 0; }
.pf-project-desc { font-size: 0.92rem; color: var(--gray); margin: 0; }
.pf-project-actions { display: flex; flex-wrap: wrap; gap: 0.45rem; align-items: flex-start; margin-top: 0.2rem; }
.pf-btn { font-size: 0.82rem; padding: 0.28rem 0.75rem; border-radius: 7px; border: 1px solid var(--lightgray); background: var(--highlight); color: var(--secondary); text-decoration: none; cursor: pointer; display: inline-block; }
.pf-btn:hover { border-color: var(--secondary); }
.pf-btn-disabled { opacity: 0.55; cursor: not-allowed; color: var(--gray); background: transparent; }
.pf-btn-disabled:hover { border-color: var(--lightgray); }
.pf-abstract { flex: 0 0 auto; }
.pf-abstract[open] { flex: 1 1 100%; }
.pf-abstract summary { list-style: none; }
.pf-abstract summary::-webkit-details-marker { display: none; }
.pf-abstract summary::marker { content: ""; }
.pf-abstract[open] > summary { background: var(--secondary); color: var(--light); border-color: var(--secondary); }
.pf-abstract-body { margin-top: 0.55rem; }
.pf-abstract-inline { margin-top: 0.25rem; }
.pf-abstract-block + .pf-abstract-block { margin-top: 0.6rem; }
.pf-abstract-lang { display: inline-block; font-size: 0.7rem; letter-spacing: 0.11em; text-transform: uppercase; color: var(--gray); font-weight: 600; margin-bottom: 0.2rem; }
.pf-abstract-block p { margin: 0; font-size: 0.95rem; line-height: 1.6; }
.pf-badge { margin-left: auto; font-size: 0.74rem; padding: 0.2rem 0.6rem; border-radius: 999px; font-weight: 600; white-space: nowrap; }
.pf-badge.lab-lcbl { background: #eaf3ee; color: #2e6b4d; border: 1px solid #d6e8de; }
.pf-badge.lab-ds { background: var(--highlight); color: var(--secondary); border: 1px solid var(--lightgray); }
.pf-badge.lab-other { background: var(--lightgray); color: var(--darkgray); }
.pf-empty { font-size: 0.95rem; color: var(--gray); font-style: italic; }
.pf-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.pf-seeall { font-size: 0.84rem; color: var(--secondary); text-decoration: none; white-space: nowrap; }
.pf-seeall:hover { text-decoration: underline; }
.pf-explore { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.9rem; }
.pf-card { border: 1px solid var(--lightgray); border-radius: 11px; padding: 1rem 1.1rem; text-decoration: none; }
.pf-card h3 { font-family: var(--headerFont); font-weight: 600; color: var(--dark); font-size: 1.12rem; margin: 0 0 0.3rem; }
.pf-card p { margin: 0; font-size: 0.92rem; color: var(--gray); line-height: 1.5; }
@media all and (max-width: 600px) {
  .pf-hero { flex-direction: column; gap: 1rem; }
  .pf-explore { grid-template-columns: 1fr; }
  .pf-contactcard { max-width: none; width: 100%; border-left: none; border-top: 1px solid var(--lightgray); padding-left: 0; padding-top: 1rem; }
  .pf-contactlist { flex-flow: row wrap; gap: 0.4rem 1.1rem; }
}
`

export default (() => Portfolio) satisfies QuartzComponentConstructor
