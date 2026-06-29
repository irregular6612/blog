import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, FullSlug } from "../util/path"
import { concatenateResources } from "../util/resources"
import Darkmode from "./Darkmode"

const DarkmodeInner = Darkmode()

interface NavLink {
  label: string
  target: FullSlug
  anchor?: string
  // Folder targets must keep a trailing slash so relative links on the
  // destination page (e.g. PageTitle's "..") resolve against the folder dir
  // rather than the user root — without it, SPA navigation lands on /AI and
  // the home link 404s. resolveRelative does not add the slash; transformLink
  // does for content links, so we mirror that here.
  folder?: boolean
  // When present, the link becomes a hover/focus dropdown parent.
  children?: NavLink[]
}

// "Wiki" points at the AI folder page as a garden entry, and reveals the
// Papers/Concepts dashboards on hover.
const LINKS: NavLink[] = [
  { label: "CV", target: "cv" as FullSlug },
  { label: "Publications", target: "publications" as FullSlug },
  { label: "Projects", target: "projects" as FullSlug },
  { label: "Talks", target: "talks" as FullSlug },
  { label: "Awards", target: "awards" as FullSlug },
  {
    label: "Wiki",
    target: "AI" as FullSlug,
    folder: true,
    children: [
      { label: "Papers", target: "papers" as FullSlug },
      { label: "Concepts", target: "concepts" as FullSlug },
    ],
  },
]

const TopNav: QuartzComponent = (props: QuartzComponentProps) => {
  const slug = props.fileData.slug!
  const home = resolveRelative(slug, "index" as FullSlug)
  const hrefOf = (l: NavLink) =>
    resolveRelative(slug, l.target) + (l.folder ? "/" : "") + (l.anchor ?? "")
  return (
    <nav class="topnav">
      <a class="topnav-brand" href={home}>
        Juhyeon Park
      </a>
      <div class="topnav-links">
        {LINKS.map((l) =>
          l.children ? (
            <div class="topnav-item" key={l.label}>
              <a class="topnav-link topnav-parent" href={hrefOf(l)}>
                {l.label} <span class="topnav-caret">▾</span>
              </a>
              <div class="topnav-dropdown">
                {l.children.map((c) => (
                  <a class="topnav-dropdown-link" key={c.label} href={hrefOf(c)}>
                    {c.label}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <a class="topnav-link" key={l.label} href={hrefOf(l)}>
              {l.label}
            </a>
          ),
        )}
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
/* Wiki dropdown */
.topnav-item { position: relative; display: flex; align-items: center; }
.topnav-parent { display: inline-flex; align-items: center; gap: 0.22rem; }
.topnav-caret { font-size: 0.58rem; opacity: 0.65; }
.topnav-dropdown {
  position: absolute; top: 100%; left: 0; z-index: 10;
  display: flex; flex-direction: column; min-width: 9rem; gap: 0.1rem;
  margin-top: 0.4rem; padding: 0.35rem;
  background: var(--light); border: 1px solid var(--lightgray); border-radius: 9px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.09);
  opacity: 0; visibility: hidden; transform: translateY(4px);
  transition: opacity 0.12s ease, transform 0.12s ease;
}
/* invisible bridge so the hover doesn't drop in the gap above the menu */
.topnav-dropdown::before { content: ""; position: absolute; top: -0.5rem; left: 0; right: 0; height: 0.5rem; }
.topnav-item:hover .topnav-dropdown,
.topnav-item:focus-within .topnav-dropdown { opacity: 1; visibility: visible; transform: translateY(0); }
.topnav-dropdown-link { font-size: 0.85rem; color: var(--gray); text-decoration: none; padding: 0.34rem 0.55rem; border-radius: 6px; white-space: nowrap; }
.topnav-dropdown-link:hover { color: var(--secondary); background: var(--highlight); }
@media all and (max-width: 600px) {
  .topnav { flex-wrap: wrap; gap: 0.6rem; }
  .topnav-links { gap: 0.7rem; flex-wrap: wrap; }
  /* on mobile the dropdown can't hover — show its links inline instead */
  .topnav-item { flex-wrap: wrap; gap: 0.7rem; }
  .topnav-dropdown {
    position: static; opacity: 1; visibility: visible; transform: none;
    flex-direction: row; gap: 0.7rem; margin: 0; padding: 0;
    background: transparent; border: none; box-shadow: none; min-width: 0;
  }
  .topnav-dropdown::before { display: none; }
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
  max-width: 1080px; width: 100%; margin: 0 auto;
}
/* renderPage always emits empty .left/.right sidebar wrappers — hide them here */
#quartz-body:has(.portfolio-root) .sidebar { display: none !important; }
`,
  DarkmodeInner.css,
)
TopNav.beforeDOMLoaded = DarkmodeInner.beforeDOMLoaded
TopNav.afterDOMLoaded = DarkmodeInner.afterDOMLoaded

export default (() => TopNav) satisfies QuartzComponentConstructor
