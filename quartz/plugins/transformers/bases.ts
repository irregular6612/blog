import { QuartzTransformerPlugin } from "../types"
import { simplifySlug, slugifyFilePath, FilePath } from "../../util/path"
import path from "path"
import fs from "fs"
import yaml from "js-yaml"
// @ts-ignore
import baseTranscludeScript from "../../components/scripts/baseTransclude.inline"
import baseTranscludeStyle from "../../components/styles/baseTransclude.scss"

export interface BasesColumn {
  id: string
  name: string
  type: "text" | "number" | "date" | "checkbox" | "select" | "multi-select" | "file" | "url"
  options?: string[]
}

export interface BasesRow {
  id: string
  values: Record<string, any>
}

export interface BasesData {
  name: string
  columns: BasesColumn[]
  rows: BasesRow[]
}

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

// Enhanced filter evaluation supporting Obsidian Dataview syntax
function evaluateFilter(file: any, filterStr: string): boolean {
  try {
    const trimmedFilter = filterStr.trim()
    
    // Property.contains("value") - Check if property contains a value
    const propContainsMatch = trimmedFilter.match(/^([A-Za-z0-9_-]+)\.contains\s*\(\s*"([^"]+)"\s*\)/)
    if (propContainsMatch) {
      const [, propName, searchValue] = propContainsMatch
      const propValue = file.frontmatter?.[propName]
      if (!propValue) return false
      
      if (Array.isArray(propValue)) {
        return propValue.some(v => String(v).includes(searchValue))
      }
      return String(propValue).includes(searchValue)
    }
    
    // Property == "value" - Check if property equals value
    const propEqMatch = trimmedFilter.match(/^([A-Za-z0-9_-]+)\s*==\s*"([^"]+)"/)
    if (propEqMatch) {
      const [, propName, targetValue] = propEqMatch
      const propValue = file.frontmatter?.[propName]
      if (!propValue) return false
      return String(propValue) === targetValue
    }
    
    // Property != "value" - Check if property not equals value
    const propNeqMatch = trimmedFilter.match(/^([A-Za-z0-9_-]+)\s*!=\s*"([^"]+)"/)
    if (propNeqMatch) {
      const [, propName, targetValue] = propNeqMatch
      const propValue = file.frontmatter?.[propName]
      if (!propValue) return true
      return String(propValue) !== targetValue
    }
    
    // file.folder.startsWith("path")
    const folderStartsMatch = trimmedFilter.match(/file\.folder\.startsWith\s*\(\s*"([^"]+)"\s*\)/)
    if (folderStartsMatch) {
      const targetPath = folderStartsMatch[1].toLowerCase().replace(/^public\//i, "")
      const filePath = file.relativePath || ""
      const fileFolder = filePath.split("/").slice(0, -1).join("/").toLowerCase().replace(/^public\//i, "")
      return fileFolder.startsWith(targetPath)
    }
    
    // file.path.startsWith("path")
    const pathStartsMatch = trimmedFilter.match(/file\.path\.startsWith\s*\(\s*"([^"]+)"\s*\)/)
    if (pathStartsMatch) {
      const targetPath = pathStartsMatch[1].toLowerCase().replace(/^public\//i, "")
      const filePath = (file.relativePath || "").toLowerCase().replace(/^public\//i, "")
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
      const fileFolder = (file.relativePath?.split("/").slice(0, -1).join("/") || "").toLowerCase().replace(/^public\//i, "")
      // Support both exact match and contains for flexibility
      return fileFolder === targetFolder || fileFolder.endsWith(targetFolder) || fileFolder.includes("/" + targetFolder)
    }

    // file.name == "name" (exact match)
    const nameEqMatch = trimmedFilter.match(/file\.name\s*==\s*"([^"]+)"/)
    if (nameEqMatch) {
      const targetName = nameEqMatch[1]
      const fileName = file.relativePath?.split("/").pop()?.replace(/\.md$/, "") || ""
      return fileName === targetName
    }

    // file.name != "name" (not equal)
    const nameNotMatch = trimmedFilter.match(/file\.name\s*!=\s*"([^"]+)"/)
    if (nameNotMatch) {
      const targetName = nameNotMatch[1]
      const fileName = file.relativePath?.split("/").pop()?.replace(/\.md$/, "") || ""
      return fileName !== targetName
    }

    // file.ext == "md" (extension match)
    const extMatch = trimmedFilter.match(/file\.ext\s*==\s*"([^"]+)"/)
    if (extMatch) {
      const targetExt = extMatch[1]
      return file.relativePath?.endsWith(`.${targetExt}`) || false
    }

    // file.ext != "base" (extension not match)
    const extNotMatch = trimmedFilter.match(/file\.ext\s*!=\s*"([^"]+)"/)
    if (extNotMatch) {
      const targetExt = extNotMatch[1]
      return !(file.relativePath?.endsWith(`.${targetExt}`))
    }

    // contains(file.folder, "text") or contains(file.path, "text")
    const containsMatch = trimmedFilter.match(/contains\s*\(\s*file\.(folder|path|name)\s*,\s*"([^"]+)"\s*\)/)
    if (containsMatch) {
      const [, field, searchText] = containsMatch
      if (field === "folder") {
        const fileFolder = file.relativePath?.split("/").slice(0, -1).join("/") || ""
        return fileFolder.includes(searchText)
      } else if (field === "path") {
        return (file.relativePath || "").includes(searchText)
      } else if (field === "name") {
        const fileName = file.relativePath?.split("/").pop()?.replace(/\.md$/, "") || ""
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

function applyFilters(files: any[], filters: BaseView["filters"]): any[] {
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

export const Bases: QuartzTransformerPlugin = () => {
  return {
    name: "Bases",
    textTransform(_ctx, src) {
      return src
    },
    markdownPlugins(ctx) {
      return [
        () => {
          return async (_tree, file) => {
            // Process .base files in transformer stage
            if (file.data.filePath?.endsWith(".base")) {
              try {
                // file.data.filePath is already an absolute path
                const basesPath = file.data.filePath
                const basesContent = fs.readFileSync(basesPath, "utf-8")
                const baseFile = yaml.load(basesContent) as BaseFile

                if (baseFile.views && baseFile.views.length > 0) {
                  const view = baseFile.views[0]

                  // Get all files from ctx (this is populated before transformers run)
                  const allFiles = ctx.allFiles || []
                  
                  // Create file data objects for filtering
                  const fileDataList = allFiles.map((fp) => ({
                    relativePath: fp,
                    slug: slugifyFilePath(fp as FilePath),
                    frontmatter: {},
                  }))

                  // Filter files based on view filters
                  const filteredFiles = applyFilters(fileDataList, view.filters)

                  // Extract columns from order
                  const columns = view.order || ["file.name"]

                  // Store bases data
                  const basesData = {
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
                    file.data.frontmatter = {
                      ...file.data.frontmatter,
                      title:
                        view.name ||
                        file.data.filePath.split("/").pop()?.replace(".base", "") ||
                        "Database",
                    }
                  }
                }
              } catch (e) {
                console.error(`Error processing base file in transformer ${file.data.filePath}:`, e)
              }
            }
          }
        },
      ]
    },
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        css: [baseTranscludeStyle],
        js: [
          {
            script: baseTranscludeScript,
            loadTime: "afterDOMReady",
            contentType: "inline",
          },
        ],
      }
    },
  }
}
