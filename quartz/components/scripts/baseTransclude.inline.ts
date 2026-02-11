document.addEventListener("nav", async () => {
  const transcludeBlocks = document.querySelectorAll<HTMLElement>(".transclude[data-url]")

  for (const transclude of transcludeBlocks) {
    const url = transclude.dataset.url
    if (!url) continue

    // Check if it's a .base file
    if (!url.endsWith(".base") && !url.endsWith("/base")) continue

    try {
      // Use the global fetchData that's already configured with correct path
      const contentIndex = await fetchData

      // Find the base file data using filename matching
      let baseData = null
      let foundSlug = null

      const cleanUrl = url
        .replace(/^\//, "")
        .replace(/\.base$/, "")
        .toLowerCase()

      console.log(`[Base Transclude] Looking for: "${cleanUrl}"`)

      // Try to find matching slug using filename
      for (const [slug, data] of Object.entries(contentIndex)) {
        if (!(data as any).bases) continue

        const cleanSlug = slug.toLowerCase()
        const slugFilename = cleanSlug.split("/").pop()?.replace(".base", "")
        const urlFilename = cleanUrl.split("/").pop()

        // Match by filename
        if (slugFilename === urlFilename) {
          baseData = (data as any).bases
          foundSlug = slug
          console.log(`[Base Transclude] MATCHED by filename: "${urlFilename}"`)
          break
        }
      }

      if (!baseData) {
        console.error(`[Base Transclude] NOT FOUND: "${cleanUrl}"`)
        console.log(
          `Available base files:`,
          Object.keys(contentIndex)
            .filter((s) => s.toLowerCase().includes("base"))
            .slice(0, 10),
        )
        continue
      }

      // Render table
      const table = renderBaseTable(baseData)
      transclude.innerHTML = table
      transclude.classList.add("base-transclude-loaded")
    } catch (error) {
      console.error(`Error loading base file ${url}:`, error)
    }
  }
})

function renderBaseTable(baseData: any): string {
  const { name, files, columns } = baseData

  let html = `
    <div class="bases-transclude-container">
      <div class="bases-transclude-header">
        <h4 class="bases-transclude-title">${name || "Database"}</h4>
        <span class="bases-transclude-count">${files.length} 항목</span>
      </div>
      <div class="bases-transclude-table-wrapper">
        <table class="bases-transclude-table">
          <thead>
            <tr>
  `

  // Render headers
  for (const column of columns) {
    const colName = formatColumnName(column)
    html += `<th class="bases-transclude-th">${colName}</th>`
  }

  html += `
            </tr>
          </thead>
          <tbody class="bases-transclude-tbody">
  `

  // Render rows
  for (const file of files) {
    html += `<tr class="bases-transclude-row">`

    for (const column of columns) {
      const value = getColumnValue(file, column)
      const displayValue = String(value).replace(/"/g, "&quot;")
      html += `<td class="bases-transclude-td" title="${displayValue}">${renderCellValue(file, column, value)}</td>`
    }

    html += `</tr>`
  }

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `

  return html
}

function formatColumnName(column: string): string {
  if (column.startsWith("file.")) {
    return column.replace("file.", "").toUpperCase()
  }
  if (column.startsWith("note.")) {
    return column.replace("note.", "")
  }
  return column
}

function getColumnValue(file: any, column: string): any {
  if (column === "file.name") {
    return file.relativePath?.split("/").pop()?.replace(/\.md$/, "") || "-"
  }
  if (column === "file.folder") {
    return file.relativePath?.split("/").slice(0, -1).join("/") || "-"
  }
  if (column === "file.ext") {
    return file.relativePath?.split(".").pop() || "-"
  }
  if (column.startsWith("note.")) {
    const prop = column.replace("note.", "")
    return file.frontmatter?.[prop] || "-"
  }
  return file.frontmatter?.[column] || "-"
}

function renderCellValue(file: any, column: string, value: any): string {
  // If it's file.name, make it a link
  if (column === "file.name") {
    const slug = file.slug || ""
    // Get base path from window location (works for both local and GitHub Pages)
    const currentPath = window.location.pathname
    const basePath = currentPath
      .split("/")
      .filter((p) => p)
      .slice(0, 1)
      .join("")
    const basePrefix = basePath && basePath !== "public" ? `/${basePath}` : ""
    return `<a href="${basePrefix}/${slug}" class="bases-transclude-link internal">${value}</a>`
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return `<div class="bases-transclude-array">${value
      .map((item) => `<span class="bases-transclude-array-item">${item}</span>`)
      .join("")}</div>`
  }

  // Handle objects
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value)
  }

  return String(value)
}
