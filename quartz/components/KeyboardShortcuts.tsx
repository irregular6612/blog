import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import keyboardShortcutsStyle from "./styles/keyboardshortcuts.scss"
// @ts-ignore
import keyboardShortcutsScript from "./scripts/keyboardshortcuts.inline"

const KeyboardShortcuts: QuartzComponent = (_props: QuartzComponentProps) => {
  return (
    <div id="keyboard-shortcuts-modal" class="keyboard-shortcuts-modal" aria-hidden="true">
      <div class="keyboard-shortcuts-overlay" />
      <div class="keyboard-shortcuts-content" role="dialog" aria-label="키보드 단축키">
        <div class="keyboard-shortcuts-header">
          <h3>키보드 단축키</h3>
          <button class="keyboard-shortcuts-close" aria-label="닫기">
            &times;
          </button>
        </div>
        <div class="keyboard-shortcuts-body">
          <table>
            <tbody>
              <tr>
                <td>
                  <kbd>/</kbd> 또는 <kbd>Ctrl</kbd>+<kbd>K</kbd>
                </td>
                <td>검색</td>
              </tr>
              <tr>
                <td>
                  <kbd>?</kbd>
                </td>
                <td>단축키 도움말</td>
              </tr>
              <tr>
                <td>
                  <kbd>Esc</kbd>
                </td>
                <td>모달 닫기</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

KeyboardShortcuts.css = keyboardShortcutsStyle
KeyboardShortcuts.afterDOMLoaded = keyboardShortcutsScript

export default (() => KeyboardShortcuts) satisfies QuartzComponentConstructor
