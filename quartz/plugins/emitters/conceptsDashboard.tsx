import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FullSlug } from "../../util/path"
import { landingLayout, sharedPageComponents } from "../../../quartz.layout"
import { ConceptsDashboard as ConceptsDashboardComponent } from "../../components"
import { write } from "./helpers"
import { defaultProcessedContent } from "../vfile"
import {
  aggregate,
  extractConceptRecord,
  selectRecent,
  ConceptDashboardData,
} from "../../util/concepts"

const DASHBOARD_SLUG = "concepts" as FullSlug

export const ConceptsDashboard: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts = {
    ...sharedPageComponents,
    ...landingLayout,
    pageBody: ConceptsDashboardComponent(),
    ...userOpts,
  } as FullPageLayout

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "ConceptsDashboard",
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
        .filter((d) => d.frontmatter?.["type"] === "concept" && d.slug)
        .map((d) =>
          extractConceptRecord(d.frontmatter as Record<string, unknown>, d.slug as string),
        )

      const dashboardData: ConceptDashboardData = {
        records,
        aggregate: aggregate(records),
        recent: selectRecent(records),
      }

      const [tree, vfile] = defaultProcessedContent({
        slug: DASHBOARD_SLUG,
        frontmatter: { title: "Concepts", tags: [] },
      })
      vfile.data.conceptsData = dashboardData

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
