document.addEventListener("nav", () => {
  const progressBar = document.getElementById("reading-progress")
  if (!progressBar) return

  function updateProgress() {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
    progressBar!.style.transform = `scaleX(${progress})`
  }

  updateProgress()
  window.addEventListener("scroll", updateProgress, { passive: true })
  window.addCleanup(() => window.removeEventListener("scroll", updateProgress))
})
