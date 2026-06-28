import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FullSlug } from "../../util/path"
import { landingLayout, sharedPageComponents } from "../../../quartz.layout"
import { CV as CVComponent } from "../../components"
import { write } from "./helpers"
import { defaultProcessedContent } from "../vfile"
import { loadPortfolio } from "../../util/portfolio"

const CV_SLUG = "cv" as FullSlug

export const CVPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts = {
    ...sharedPageComponents,
    ...landingLayout,
    pageBody: CVComponent(),
    ...userOpts,
  } as FullPageLayout

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "CVPage",
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
        slug: CV_SLUG,
        frontmatter: { title: `${portfolioData.profile.name} — CV`, tags: [] },
      })
      vfile.data.portfolioData = portfolioData

      const externalResources = pageResources(pathToRoot(CV_SLUG), resources)
      const componentData: QuartzComponentProps = {
        ctx,
        fileData: vfile.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles,
      }

      const renderedContent = renderPage(cfg, CV_SLUG, componentData, opts, externalResources)
      yield write({ ctx, content: renderedContent, slug: CV_SLUG, ext: ".html" })
    },
  }
}
