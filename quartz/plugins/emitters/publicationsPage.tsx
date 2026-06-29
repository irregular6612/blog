import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FullSlug } from "../../util/path"
import { landingLayout, sharedPageComponents } from "../../../quartz.layout"
import { Publications as PublicationsComponent } from "../../components"
import { write } from "./helpers"
import { defaultProcessedContent } from "../vfile"
import { loadPortfolio } from "../../util/portfolio"

const PUBLICATIONS_SLUG = "publications" as FullSlug

export const PublicationsPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts = {
    ...sharedPageComponents,
    ...landingLayout,
    pageBody: PublicationsComponent(),
    ...userOpts,
  } as FullPageLayout

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "PublicationsPage",
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
        slug: PUBLICATIONS_SLUG,
        frontmatter: { title: `${portfolioData.profile.name} — Publications`, tags: [] },
      })
      vfile.data.portfolioData = portfolioData

      const externalResources = pageResources(pathToRoot(PUBLICATIONS_SLUG), resources)
      const componentData: QuartzComponentProps = {
        ctx,
        fileData: vfile.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles,
      }

      const renderedContent = renderPage(
        cfg,
        PUBLICATIONS_SLUG,
        componentData,
        opts,
        externalResources,
      )
      yield write({ ctx, content: renderedContent, slug: PUBLICATIONS_SLUG, ext: ".html" })
    },
  }
}
