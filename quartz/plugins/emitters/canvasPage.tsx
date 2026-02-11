import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FullSlug, SimpleSlug } from "../../util/path"
import { defaultContentPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { CanvasPage as CanvasPageComponent } from "../../components"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { Node } from "unist"
import { StaticResources } from "../../util/resources"
import { QuartzPluginData } from "../vfile"
import fs from "fs"

interface CanvasNode {
  id: string
  type: "file" | "text" | "group" | "link"
  x: number
  y: number
  width: number
  height: number
  file?: string
  text?: string
  label?: string
  color?: string
}

interface CanvasEdge {
  id: string
  fromNode: string
  fromSide: string
  toNode: string
  toSide: string
  label?: string
}

interface CanvasData {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

async function processCanvas(
  ctx: BuildCtx,
  _tree: Node,
  fileData: QuartzPluginData,
  allFiles: QuartzPluginData[],
  opts: FullPageLayout,
  resources: StaticResources,
) {
  const slug = fileData.slug!
  const cfg = ctx.cfg.configuration
  const externalResources = pageResources(pathToRoot(slug), resources)
  const componentData: QuartzComponentProps = {
    ctx,
    fileData,
    externalResources,
    cfg,
    children: [],
    tree: _tree,
    allFiles,
  }

  const content = renderPage(cfg, slug, componentData, opts, externalResources)
  return write({
    ctx,
    content,
    slug,
    ext: ".html",
  })
}

export const CanvasPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: CanvasPageComponent(),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "CanvasPage",
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

      for (const [tree, file] of content) {
        if (file.data.filePath?.endsWith(".canvas")) {
          try {
            // file.data.filePath is already an absolute path
            const canvasPath = file.data.filePath
            const canvasContent = fs.readFileSync(canvasPath, "utf-8")
            const canvasData: CanvasData = JSON.parse(canvasContent)

            // Store canvas data in file.data for use by components
            file.data.canvas = canvasData

            // Extract links from canvas nodes for graph
            const links: string[] = []
            canvasData.nodes.forEach((node) => {
              if (node.type === "file" && node.file) {
                // Convert file path to slug
                const slug = node.file.replace(/\.md$/, "").replace(/\s+/g, "-").toLowerCase()
                links.push(slug)
              }
            })
            file.data.links = links as SimpleSlug[]

            // Set title from filename if not set
            if (!file.data.frontmatter?.title) {
              const fileName =
                file.data.filePath.split("/").pop()?.replace(".canvas", "") || "Canvas"
              file.data.frontmatter = { ...file.data.frontmatter, title: fileName }
            }

            const output = await processCanvas(ctx, tree, file.data, allFiles, opts, resources)
            yield output
          } catch (e) {
            console.error(`Error processing canvas file ${file.data.filePath}:`, e)
          }
        }
      }

      // Generate canvas-index.json for transclude functionality
      const canvasIndex: Record<string, any> = {}
      for (const [_tree, file] of content) {
        if (file.data.filePath?.endsWith(".canvas") && file.data.canvas) {
          canvasIndex[file.data.slug!] = {
            canvas: file.data.canvas,
          }
        }
      }

      if (Object.keys(canvasIndex).length > 0) {
        yield write({
          ctx,
          content: JSON.stringify(canvasIndex),
          slug: "static/canvas-index" as FullSlug,
          ext: ".json",
        })
      }
    },
  }
}
