import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FullSlug } from "../../util/path"
import { defaultContentPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { PapersDashboard as PapersDashboardComponent } from "../../components"
import { write } from "./helpers"
import { defaultProcessedContent } from "../vfile"
import { aggregate, extractPaperRecord, selectSpotlight, DashboardData } from "../../util/papers"

const DASHBOARD_SLUG = "papers" as FullSlug

export const PapersDashboard: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: PapersDashboardComponent(),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "PapersDashboard",
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

      const records = allFiles
        .filter((d) => d.frontmatter?.["type"] === "paper" && d.slug)
        .map((d) => extractPaperRecord(d.frontmatter as Record<string, unknown>, d.slug as string))

      const dashboardData: DashboardData = {
        records,
        aggregate: aggregate(records),
        spotlight: selectSpotlight(records),
      }

      const [tree, vfile] = defaultProcessedContent({
        slug: DASHBOARD_SLUG,
        frontmatter: { title: "Research Papers", tags: [] },
      })
      vfile.data.papersData = dashboardData

      const externalResources = pageResources(pathToRoot(DASHBOARD_SLUG), resources)
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
        DASHBOARD_SLUG,
        componentData,
        opts,
        externalResources,
      )

      yield write({
        ctx,
        content: renderedContent,
        slug: DASHBOARD_SLUG,
        ext: ".html",
      })
    },
  }
}
