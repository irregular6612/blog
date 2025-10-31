import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { VFile } from "vfile"
import path from "path"
// @ts-ignore
import canvasTranscludeScript from "../../components/scripts/canvasTransclude.inline"
import canvasTranscludeStyle from "../../components/styles/canvasTransclude.scss"

export interface CanvasNode {
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

export interface CanvasEdge {
  id: string
  fromNode: string
  fromSide: "left" | "right" | "top" | "bottom"
  toNode: string
  toSide: "left" | "right" | "top" | "bottom"
  label?: string
}

export interface CanvasData {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export const Canvas: QuartzTransformerPlugin = () => {
  return {
    name: "Canvas",
    textTransform(_ctx, src) {
      return src
    },
    markdownPlugins() {
      return []
    },
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        css: [canvasTranscludeStyle],
        js: [
          {
            src: "https://unpkg.com/panzoom@9.4.3/dist/panzoom.min.js",
            loadTime: "afterDOMReady",
            contentType: "external",
          },
          {
            script: canvasTranscludeScript,
            loadTime: "afterDOMReady",
            contentType: "inline",
          },
        ],
      }
    },
  }
}

