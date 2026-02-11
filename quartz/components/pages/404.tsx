import { i18n } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { resolveRelative } from "../../util/path"
import { byDateAndAlphabetical } from "../PageList"

const NotFound: QuartzComponent = ({ cfg, allFiles, fileData }: QuartzComponentProps) => {
  // If baseUrl contains a pathname after the domain, use this as the home link
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  const recentPosts = allFiles
    .filter((f) => f.slug !== "index" && !f.frontmatter?.draft)
    .sort(byDateAndAlphabetical(cfg))
    .slice(0, 5)

  return (
    <article class="popover-hint">
      <h1>404</h1>
      <p>{i18n(cfg.locale).pages.error.notFound}</p>
      <a href={baseDir}>{i18n(cfg.locale).pages.error.home}</a>

      {recentPosts.length > 0 && (
        <div class="not-found-recent">
          <h3>최근 게시글</h3>
          <ul>
            {recentPosts.map((post) => (
              <li>
                <a href={resolveRelative(fileData.slug!, post.slug!)} class="internal">
                  {post.frontmatter?.title ?? "제목 없음"}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
