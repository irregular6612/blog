import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingProgressStyle from "./styles/readingprogress.scss"
// @ts-ignore
import readingProgressScript from "./scripts/readingprogress.inline"

const ReadingProgress: QuartzComponent = (_props: QuartzComponentProps) => {
  return <div id="reading-progress" class="reading-progress" />
}

ReadingProgress.css = readingProgressStyle
ReadingProgress.afterDOMLoaded = readingProgressScript

export default (() => ReadingProgress) satisfies QuartzComponentConstructor
