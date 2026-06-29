import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FullSlug } from "../../util/path"
import { landingLayout, sharedPageComponents } from "../../../quartz.layout"
import { Talks as TalksComponent } from "../../components"
import { write } from "./helpers"
import { defaultProcessedContent } from "../vfile"
import { loadPortfolio } from "../../util/portfolio"

const TALKS_SLUG = "talks" as FullSlug

export const TalksPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts = {
    ...sharedPageComponents,
    ...landingLayout,
    pageBody: TalksComponent(),
    ...userOpts,
  } as FullPageLayout

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "TalksPage",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration
      const portfolioData = loadPortfolio()

      const [tree, vfile] = defaultProcessedContent({
        slug: TALKS_SLUG,
        frontmatter: { title: `${portfolioData.profile.name} — Talks`, tags: [] },
      })
      vfile.data.portfolioData = portfolioData

      const externalResources = pageResources(pathToRoot(TALKS_SLUG), resources)
      const componentData: QuartzComponentProps = {
        ctx,
        fileData: vfile.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles,
      }

      const renderedContent = renderPage(cfg, TALKS_SLUG, componentData, opts, externalResources)
      yield write({ ctx, content: renderedContent, slug: TALKS_SLUG, ext: ".html" })
    },
  }
}
