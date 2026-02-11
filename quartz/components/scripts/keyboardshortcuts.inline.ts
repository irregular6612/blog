document.addEventListener("nav", () => {
  const modal = document.getElementById("keyboard-shortcuts-modal")
  if (!modal) return

  const overlay = modal.querySelector<HTMLElement>(".keyboard-shortcuts-overlay")
  const closeBtn = modal.querySelector<HTMLElement>(".keyboard-shortcuts-close")

  function isInputFocused(): boolean {
    const el = document.activeElement
    if (!el) return false
    const tag = el.tagName
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      (el as HTMLElement).isContentEditable
    )
  }

  function openModal() {
    modal!.classList.add("active")
    modal!.setAttribute("aria-hidden", "false")
  }

  function closeModal() {
    modal!.classList.remove("active")
    modal!.setAttribute("aria-hidden", "true")
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "?" && !isInputFocused()) {
      e.preventDefault()
      if (modal!.classList.contains("active")) {
        closeModal()
      } else {
        openModal()
      }
    }
    if (e.key === "Escape" && modal!.classList.contains("active")) {
      closeModal()
    }
  }

  function onOverlayClick() {
    closeModal()
  }

  function onCloseClick() {
    closeModal()
  }

  document.addEventListener("keydown", onKeyDown)
  overlay?.addEventListener("click", onOverlayClick)
  closeBtn?.addEventListener("click", onCloseClick)

  window.addCleanup(() => {
    document.removeEventListener("keydown", onKeyDown)
    overlay?.removeEventListener("click", onOverlayClick)
    closeBtn?.removeEventListener("click", onCloseClick)
  })
})
