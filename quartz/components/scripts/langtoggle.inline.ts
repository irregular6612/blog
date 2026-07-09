const savedLang = (localStorage.getItem("lang") as "en" | "ko" | null) ?? "en"
document.documentElement.setAttribute("saved-lang", savedLang)

const emitLangChangeEvent = (lang: "en" | "ko") => {
  const event: CustomEventMap["langchange"] = new CustomEvent("langchange", {
    detail: { lang },
  })
  document.dispatchEvent(event)
}

const syncToggleState = (lang: "en" | "ko") => {
  for (const toggle of document.getElementsByClassName("langtoggle")) {
    // aria-checked=true means "Korean is active" (the switch is flipped on).
    toggle.setAttribute("aria-checked", lang === "ko" ? "true" : "false")
  }
}

document.addEventListener("nav", () => {
  const current = (document.documentElement.getAttribute("saved-lang") as "en" | "ko") ?? "en"
  syncToggleState(current)

  const switchLang = () => {
    const newLang = document.documentElement.getAttribute("saved-lang") === "ko" ? "en" : "ko"
    document.documentElement.setAttribute("saved-lang", newLang)
    localStorage.setItem("lang", newLang)
    syncToggleState(newLang)
    emitLangChangeEvent(newLang)
  }

  for (const toggle of document.getElementsByClassName("langtoggle")) {
    toggle.addEventListener("click", switchLang)
    window.addCleanup(() => toggle.removeEventListener("click", switchLang))
  }
})
