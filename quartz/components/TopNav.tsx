import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, FullSlug } from "../util/path"
import { concatenateResources } from "../util/resources"
import Darkmode from "./Darkmode"

const DarkmodeInner = Darkmode()

interface NavLink {
  label: string
  target: FullSlug
  anchor?: string
}

// "Wiki" points at the AI folder page as a garden entry — change target if desired.
const LINKS: NavLink[] = [
  { label: "About", target: "index" as FullSlug, anchor: "#about" },
  { label: "Publications", target: "index" as FullSlug, anchor: "#publications" },
  { label: "Projects", target: "index" as FullSlug, anchor: "#projects" },
  { label: "Papers", target: "papers" as FullSlug },
  { label: "Wiki", target: "AI" as FullSlug },
  { label: "CV", target: "cv" as FullSlug },
]

const TopNav: QuartzComponent = (props: QuartzComponentProps) => {
  const slug = props.fileData.slug!
  const home = resolveRelative(slug, "index" as FullSlug)
  return (
    <nav class="topnav">
      <a class="topnav-brand" href={home}>
        Juhyeon Park
      </a>
      <div class="topnav-links">
        {LINKS.map((l) => (
          <a
            class="topnav-link"
            key={l.label}
            href={resolveRelative(slug, l.target) + (l.anchor ?? "")}
          >
            {l.label}
          </a>
        ))}
        <DarkmodeInner {...props} />
      </div>
    </nav>
  )
}

TopNav.css = concatenateResources(
  `
.topnav {
  display: flex; align-items: center; gap: 1.2rem;
  padding: 0.9rem 0; margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--lightgray);
  position: sticky; top: 0; z-index: 5;
  background: var(--light);
}
.topnav-brand { font-family: var(--headerFont); font-weight: 600; font-size: 1.1rem; color: var(--dark); margin-right: auto; text-decoration: none; }
.topnav-links { display: flex; align-items: center; gap: 1.1rem; }
.topnav-link { font-size: 0.85rem; color: var(--gray); text-decoration: none; }
.topnav-link:hover { color: var(--secondary); }
@media all and (max-width: 600px) {
  .topnav { flex-wrap: wrap; gap: 0.6rem; }
  .topnav-links { gap: 0.7rem; flex-wrap: wrap; }
}

/* Full-width: collapse the Quartz grid to one column on portfolio surfaces */
#quartz-body:has(.portfolio-root) {
  grid-template-columns: auto !important;
  grid-template-areas:
    "grid-header"
    "grid-center"
    "grid-footer" !important;
}
#quartz-body:has(.portfolio-root) .center {
  max-width: 920px; width: 100%; margin: 0 auto;
}
/* renderPage always emits empty .left/.right sidebar wrappers — hide them here */
#quartz-body:has(.portfolio-root) .sidebar { display: none !important; }
`,
  DarkmodeInner.css,
)
TopNav.beforeDOMLoaded = DarkmodeInner.beforeDOMLoaded
TopNav.afterDOMLoaded = DarkmodeInner.afterDOMLoaded

export default (() => TopNav) satisfies QuartzComponentConstructor
