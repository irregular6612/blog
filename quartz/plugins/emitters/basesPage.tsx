import path from "path"
import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { pathToRoot, FilePath, simplifySlug, FullSlug } from "../../util/path"
import { defaultContentPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { BasesPage as BasesPageComponent } from "../../components"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { Node } from "unist"
import { StaticResources } from "../../util/resources"
import { QuartzPluginData } from "../vfile"
import fs from "fs"
import yaml from "js-yaml"

interface BaseView {
  type: "table"
  name: string
  filters?: {
    and?: string[]
    or?: string[]
  }
  order?: string[]
  columnSize?: Record<string, number>
}

interface BaseFile {
  views: BaseView[]
}

interface BasesData {
  name: string
  view: BaseView
  files: QuartzPluginData[]
  columns: string[]
}

async function processBases(
  ctx: BuildCtx,
  tree: Node,
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
    tree,
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

// Enhanced filter evaluation supporting Obsidian Dataview syntax
function evaluateFilter(file: QuartzPluginData, filterStr: string): boolean {
  try {
    const trimmedFilter = filterStr.trim()
    
    // file.path.startsWith("path")
    const pathStartsMatch = trimmedFilter.match(/file\.path\.startsWith\s*\(\s*"([^"]+)"\s*\)/)
    if (pathStartsMatch) {
      const targetPath = pathStartsMatch[1].toLowerCase().replace(/^public\//i, "")
      const filePath = (file.relativePath || file.filePath || "").toLowerCase().replace(/^public\//i, "")
      return filePath.startsWith(targetPath)
    }
    
    // file.inFolder("path") - check if file is in folder (exact match or subdirectory)
    const inFolderMatch = trimmedFilter.match(/file\.inFolder\s*\(\s*"([^"]+)"\s*\)/)
    if (inFolderMatch) {
      const targetFolder = inFolderMatch[1].replace(/^public\//i, "").replace(/\/$/, "")
      const filePath = file.relativePath || file.filePath || ""
      const fileFolder = filePath.split("/").slice(0, -1).join("/").replace(/^public\//i, "")
      
      // Normalize for comparison (case-insensitive + Unicode normalization)
      const normalizedTarget = targetFolder.toLowerCase().normalize("NFC")
      const normalizedFolder = fileFolder.toLowerCase().normalize("NFC")
      
      // Check if file is in the exact folder or any subfolder
      return normalizedFolder === normalizedTarget || 
             normalizedFolder.startsWith(normalizedTarget + "/")
    }
    
    // file.folder == "path" (exact match or contains, case-insensitive)
    const folderEqMatch = trimmedFilter.match(/file\.folder\s*==\s*"([^"]+)"/)
    if (folderEqMatch) {
      const targetFolder = folderEqMatch[1].toLowerCase().replace(/^public\//i, "")
      const filePath = file.relativePath || file.filePath || ""
      const fileFolder = filePath.split("/").slice(0, -1).join("/").toLowerCase().replace(/^public\//i, "")
      // Support both exact match and contains for flexibility
      return fileFolder === targetFolder || fileFolder.endsWith(targetFolder) || fileFolder.includes("/" + targetFolder)
    }

    // file.name == "name" (exact match)
    const nameEqMatch = trimmedFilter.match(/file\.name\s*==\s*"([^"]+)"/)
    if (nameEqMatch) {
      const targetName = nameEqMatch[1]
      const filePath = file.relativePath || file.filePath || ""
      const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") || ""
      return fileName === targetName
    }

    // file.name != "name" (not equal)
    const nameNotMatch = trimmedFilter.match(/file\.name\s*!=\s*"([^"]+)"/)
    if (nameNotMatch) {
      const targetName = nameNotMatch[1]
      const filePath = file.relativePath || file.filePath || ""
      const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") || ""
      return fileName !== targetName
    }

    // file.ext == "md" (extension match)
    const extMatch = trimmedFilter.match(/file\.ext\s*==\s*"([^"]+)"/)
    if (extMatch) {
      const targetExt = extMatch[1]
      const filePath = file.relativePath || file.filePath || ""
      return filePath.endsWith(`.${targetExt}`) || false
    }

    // file.ext != "base" (extension not match)
    const extNotMatch = trimmedFilter.match(/file\.ext\s*!=\s*"([^"]+)"/)
    if (extNotMatch) {
      const targetExt = extNotMatch[1]
      const filePath = file.relativePath || file.filePath || ""
      return !(filePath.endsWith(`.${targetExt}`))
    }

    // contains(file.folder, "text") or contains(file.path, "text")
    const containsMatch = trimmedFilter.match(/contains\s*\(\s*file\.(folder|path|name)\s*,\s*"([^"]+)"\s*\)/)
    if (containsMatch) {
      const [, field, searchText] = containsMatch
      const filePath = file.relativePath || file.filePath || ""
      if (field === "folder") {
        const fileFolder = filePath.split("/").slice(0, -1).join("/")
        return fileFolder.includes(searchText)
      } else if (field === "path") {
        return filePath.includes(searchText)
      } else if (field === "name") {
        const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") || ""
        return fileName.includes(searchText)
      }
    }

    // Default: return true for unknown filters to avoid hiding content
    return true
  } catch (e) {
    console.warn("Filter evaluation error:", filterStr, e)
    return true
  }
}

function applyFilters(files: QuartzPluginData[], filters: BaseView["filters"]): QuartzPluginData[] {
  if (!filters) return files

  return files.filter((file) => {
    if (filters.and) {
      return filters.and.every((filterStr) => evaluateFilter(file, filterStr))
    }
    if (filters.or) {
      return filters.or.some((filterStr) => evaluateFilter(file, filterStr))
    }
    return true
  })
}

export const BasesPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: BasesPageComponent(),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "BasesPage",
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

      // First pass: Process all .base files and set file.data.bases
      // This ensures ContentIndex emitter can access bases data
      for (const [tree, file] of content) {
        if (file.data.filePath?.endsWith(".base")) {
          try {
            // file.data.filePath is already an absolute path
            const basesPath = file.data.filePath
            const basesContent = fs.readFileSync(basesPath, "utf-8")
            const baseFile = yaml.load(basesContent) as BaseFile

            if (!baseFile.views || baseFile.views.length === 0) {
              console.warn(`No views found in ${file.data.filePath}`)
              continue
            }

            // Use first view
            const view = baseFile.views[0]

            // Filter files based on view filters - use processed content with frontmatter
            const filteredFiles = applyFilters(allFiles, view.filters)

            // Extract columns from order
            const columns = view.order || ["file.name"]

            // Store bases data
            const basesData: BasesData = {
              name: view.name || "Database",
              view,
              files: filteredFiles,
              columns,
            }

            file.data.bases = basesData

            // Extract links for graph
            const links: string[] = filteredFiles
              .filter((f) => f.slug)
              .map((f) => simplifySlug(f.slug!))
            file.data.links = links

            // Set title
            if (!file.data.frontmatter?.title) {
              const title =
                view.name || file.data.filePath.split("/").pop()?.replace(".base", "") || "Database"
              file.data.frontmatter = { ...file.data.frontmatter, title }
            }
          } catch (e) {
            console.error(`Error processing base file ${file.data.filePath}:`, e)
          }
        }
      }

      // Second pass: Generate HTML pages for .base files
      for (const [tree, file] of content) {
        if (file.data.filePath?.endsWith(".base") && file.data.bases) {
          try {
            const output = await processBases(ctx, tree, file.data, allFiles, opts, resources)
            yield output
          } catch (e) {
            console.error(`Error emitting base page ${file.data.filePath}:`, e)
          }
        }
      }

      // Third pass: Generate bases-index.json for transclude functionality
      const basesIndex: Record<string, any> = {}
      for (const [tree, file] of content) {
        if (file.data.filePath?.endsWith(".base") && file.data.bases) {
          const basesData = file.data.bases
          
          basesIndex[file.data.slug!] = {
            bases: {
              name: basesData.name,
              view: basesData.view,
              columns: basesData.columns,
              files: (basesData.files || []).map((f: any) => ({
                slug: f.slug,
                relativePath: f.relativePath || f.filePath,
                frontmatter: f.frontmatter,
              })),
            },
          }
        }
      }

      if (Object.keys(basesIndex).length > 0) {
        yield write({
          ctx,
          content: JSON.stringify(basesIndex),
          slug: "static/bases-index" as FullSlug,
          ext: ".json",
        })
      }
    },
  }
}
