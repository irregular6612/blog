import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { classNames } from "../../util/lang"

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

interface CanvasPageProps {
  canvas: CanvasData
  baseUrl: string
}

function CanvasRenderer({ canvas, baseUrl }: CanvasPageProps) {
  const { nodes, edges } = canvas

  // Calculate bounds
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  nodes.forEach((node) => {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + node.width)
    maxY = Math.max(maxY, node.y + node.height)
  })

  const padding = 100
  const viewBoxWidth = maxX - minX + padding * 2
  const viewBoxHeight = maxY - minY + padding * 2
  const viewBox = `${minX - padding} ${minY - padding} ${viewBoxWidth} ${viewBoxHeight}`

  // Helper to get edge connection point
  const getEdgePoint = (nodeId: string, side: string) => {
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

  // Convert file path to URL
  const getFileUrl = (filePath: string) => {
    // Remove .md extension and convert to slug
    const slug = filePath
      .replace(/\.md$/, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/^public\//, "")
    return `/${baseUrl ? baseUrl + "/" : ""}${slug}`
  }

  return (
    <div className="canvas-container">
      <div className="canvas-controls">
        <button className="canvas-control-btn" id="canvas-zoom-in" title="확대">
          +
        </button>
        <button className="canvas-control-btn" id="canvas-zoom-out" title="축소">
          −
        </button>
        <button className="canvas-control-btn" id="canvas-reset" title="초기화">
          ⟲
        </button>
      </div>
      <svg
        id="canvas-svg"
        className="canvas-svg"
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="var(--gray)" />
          </marker>
        </defs>

        {/* Render edges first (so they appear behind nodes) */}
        <g className="canvas-edges">
          {edges.map((edge) => {
            const fromPoint = getEdgePoint(edge.fromNode, edge.fromSide)
            const toPoint = getEdgePoint(edge.toNode, edge.toSide)

            return (
              <line
                key={edge.id}
                x1={fromPoint.x}
                y1={fromPoint.y}
                x2={toPoint.x}
                y2={toPoint.y}
                stroke="var(--gray)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            )
          })}
        </g>

        {/* Render nodes */}
        <g className="canvas-nodes">
          {nodes.map((node) => {
            const isFile = node.type === "file"
            const nodeColor = node.color || "var(--light)"

            return (
              <g key={node.id} className="canvas-node">
                {/* Node background */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill={nodeColor}
                  stroke="var(--lightgray)"
                  strokeWidth="2"
                  rx="8"
                  className="canvas-node-bg"
                />

                {/* Node content */}
                {isFile && node.file ? (
                  <a href={getFileUrl(node.file)} className="canvas-node-link">
                    <foreignObject
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                    >
                      <div className="canvas-node-content">
                        <div className="canvas-node-title">
                          {node.file.split("/").pop()?.replace(".md", "")}
                        </div>
                      </div>
                    </foreignObject>
                  </a>
                ) : node.type === "text" ? (
                  <foreignObject x={node.x} y={node.y} width={node.width} height={node.height}>
                    <div className="canvas-node-content canvas-node-text">
                      {node.text || ""}
                    </div>
                  </foreignObject>
                ) : node.type === "link" && node.file?.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                  <image
                    href={`/${node.file}`}
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    preserveAspectRatio="xMidYMid meet"
                  />
                ) : null}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

const CanvasPage: QuartzComponent = (props: QuartzComponentProps) => {
  const { fileData, cfg } = props
  const canvas = fileData.canvas as CanvasData | undefined

  if (!canvas) {
    return <div>Canvas 데이터를 찾을 수 없습니다.</div>
  }

  return (
    <div className="canvas-page">
      <CanvasRenderer canvas={canvas} baseUrl={cfg?.configuration?.baseUrl || ""} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const svg = document.getElementById('canvas-svg');
            if (svg && typeof panzoom !== 'undefined') {
              const pz = panzoom(svg, {
                maxZoom: 5,
                minZoom: 0.1,
                bounds: true,
                boundsPadding: 0.1,
              });

              // Control buttons
              const zoomInBtn = document.getElementById('canvas-zoom-in');
              const zoomOutBtn = document.getElementById('canvas-zoom-out');
              const resetBtn = document.getElementById('canvas-reset');
              
              if (zoomInBtn) {
                zoomInBtn.addEventListener('click', function() {
                  pz.zoomIn();
                });
              }
              if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', function() {
                  pz.zoomOut();
                });
              }
              if (resetBtn) {
                resetBtn.addEventListener('click', function() {
                  pz.moveTo(0, 0);
                  pz.zoomAbs(0, 0, 1);
                });
              }
            }
          });
        `,
        }}
      />
    </div>
  )
}

CanvasPage.css = `
.canvas-page {
  width: 100%;
  min-height: 600px;
  position: relative;
}

.canvas-container {
  width: 100%;
  height: 600px;
  position: relative;
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  overflow: hidden;
}

.canvas-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.canvas-svg:active {
  cursor: grabbing;
}

.canvas-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.canvas-control-btn {
  width: 40px;
  height: 40px;
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--darkgray);
}

.canvas-control-btn:hover {
  background: var(--lightgray);
  transform: scale(1.05);
}

.canvas-control-btn:active {
  transform: scale(0.95);
}

.canvas-node-bg {
  transition: all 0.2s ease;
}

.canvas-node-bg:hover {
  filter: brightness(0.95);
  stroke: var(--secondary);
  stroke-width: 3;
}

.canvas-node-link {
  text-decoration: none;
  color: inherit;
}

.canvas-node-content {
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--darkgray);
  overflow: hidden;
}

.canvas-node-title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

.canvas-node-text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  text-align: left;
  align-items: flex-start;
}

.canvas-edges line {
  transition: all 0.2s ease;
}

.canvas-edges line:hover {
  stroke: var(--secondary);
  stroke-width: 3;
}
`

export default (() => CanvasPage) satisfies QuartzComponentConstructor
