// @ts-ignore
import langToggleScript from "./scripts/langtoggle.inline"
import styles from "./styles/langtoggle.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const LangToggle: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <button
      class={classNames(displayClass, "langtoggle")}
      role="switch"
      aria-checked="false"
      aria-label="Toggle language between English and Korean"
      tabIndex={0}
    >
      <span class="langtoggle-label langtoggle-ko" aria-hidden="true">
        KO
      </span>
      <span class="langtoggle-track" aria-hidden="true">
        <span class="langtoggle-knob"></span>
      </span>
      <span class="langtoggle-label langtoggle-en" aria-hidden="true">
        EN
      </span>
    </button>
  )
}

LangToggle.beforeDOMLoaded = langToggleScript
LangToggle.css = styles

export default (() => LangToggle) satisfies QuartzComponentConstructor
