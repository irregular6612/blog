document.addEventListener("nav", async () => {
  const transcludeBlocks = document.querySelectorAll<HTMLElement>(".transclude[data-url]")

  for (const transclude of transcludeBlocks) {
    const url = transclude.dataset.url
    if (!url) continue

    // Check if it's a .canvas file
    if (!url.endsWith(".canvas") && !url.endsWith("/canvas")) continue

    try {
      // Fetch the canvas data from canvas-index
      const response = await fetch(`/static/canvas-index.json`)
      if (!response.ok) {
        console.warn(`Failed to fetch canvas-index.json`)
        continue
      }

      const canvasIndex = await response.json()
      
      // Find the canvas file data - try multiple matching strategies
      let canvasData = null
      const cleanUrl = url.replace(/^\//, "").replace(/\.canvas$/, "").toLowerCase()
      
      for (const [slug, data] of Object.entries(canvasIndex)) {
        const cleanSlug = slug.toLowerCase()
        
        // Try exact match first
        if (cleanSlug === cleanUrl || cleanSlug === cleanUrl + ".canvas") {
          canvasData = (data as any).canvas
          break
        }
        
        // Try contains match
        if (cleanSlug.includes(cleanUrl) || cleanUrl.includes(cleanSlug.replace(/\.canvas$/, ""))) {
          canvasData = (data as any).canvas
          break
        }
      }

      if (!canvasData) {
        console.warn(`Canvas data not found for ${url}. Available slugs:`, Object.keys(canvasIndex))
        continue
      }

      // Render canvas
      const canvasHtml = renderCanvas(canvasData, url)
      transclude.innerHTML = canvasHtml
      transclude.classList.add("canvas-transclude-loaded")

      // Initialize panzoom if available
      if (typeof (window as any).panzoom !== "undefined") {
        const svg = transclude.querySelector(".canvas-transclude-svg")
        if (svg) {
          ;(window as any).panzoom(svg, {
            maxZoom: 5,
            minZoom: 0.1,
            bounds: true,
            boundsPadding: 0.1,
          })
        }
      }
    } catch (error) {
      console.error(`Error loading canvas file ${url}:`, error)
    }
  }
})

function renderCanvas(canvasData: any, baseUrl: string): string {
  const { nodes, edges } = canvasData

  // Calculate bounds
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  nodes.forEach((node: any) => {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + node.width)
    maxY = Math.max(maxY, node.y + node.height)
  })

  const padding = 100
  const viewBoxWidth = maxX - minX + padding * 2
  const viewBoxHeight = maxY - minY + padding * 2
  const viewBox = `${minX - padding} ${minY - padding} ${viewBoxWidth} ${viewBoxHeight}`

  let html = `
    <div class="canvas-transclude-container">
      <svg class="canvas-transclude-svg" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrowhead-transclude" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="var(--gray)" />
          </marker>
        </defs>
        <g class="canvas-transclude-edges">
  `

  // Render edges
  edges.forEach((edge: any) => {
    const fromPoint = getEdgePoint(nodes, edge.fromNode, edge.fromSide)
    const toPoint = getEdgePoint(nodes, edge.toNode, edge.toSide)

    html += `<line x1="${fromPoint.x}" y1="${fromPoint.y}" x2="${toPoint.x}" y2="${toPoint.y}" stroke="var(--gray)" stroke-width="2" marker-end="url(#arrowhead-transclude)" />`
  })

  html += `</g><g class="canvas-transclude-nodes">`

  // Render nodes
  nodes.forEach((node: any) => {
    const nodeColor = node.color || "var(--light)"
    const isFile = node.type === "file"

    html += `<g class="canvas-transclude-node">`
    html += `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="${nodeColor}" stroke="var(--lightgray)" stroke-width="2" rx="8" />`

    if (isFile && node.file) {
      const fileName = node.file.split("/").pop()?.replace(".md", "") || node.file
      const fileUrl = getFileUrl(node.file, baseUrl)
      html += `<foreignObject x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}">
        <div class="canvas-transclude-node-content">
          <a href="${fileUrl}" class="canvas-transclude-node-link">${fileName}</a>
        </div>
      </foreignObject>`
    } else if (node.type === "text") {
      const text = (node.text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      html += `<foreignObject x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}">
        <div class="canvas-transclude-node-content canvas-transclude-node-text">${text}</div>
      </foreignObject>`
    } else if (node.type === "link" && node.file?.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
      html += `<image href="/${node.file}" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" preserveAspectRatio="xMidYMid meet" />`
    }

    html += `</g>`
  })

  html += `</g></svg></div>`

  return html
}

function getEdgePoint(nodes: any[], nodeId: string, side: string): { x: number; y: number } {
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return { x: 0, y: 0 }

  switch (side) {
    case "left":
      return { x: node.x, y: node.y + node.height / 2 }
    case "right":
      return { x: node.x + node.width, y: node.y + node.height / 2 }
    case "top":
      return { x: node.x + node.width / 2, y: node.y }
    case "bottom":
      return { x: node.x + node.width / 2, y: node.y + node.height }
    default:
      return { x: node.x + node.width / 2, y: node.y + node.height / 2 }
  }
}

function getFileUrl(filePath: string, baseUrl: string): string {
  const slug = filePath
    .replace(/\.md$/, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/^public\//, "")
  
  // Extract base path from baseUrl (remove leading slash if present)
  const basePath = baseUrl.replace(/^\//, "").split("/")[0]
  return basePath ? `/${basePath}/${slug}` : `/${slug}`
}

