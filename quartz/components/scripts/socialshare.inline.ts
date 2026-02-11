document.addEventListener("nav", () => {
  const buttons = document.querySelectorAll<HTMLButtonElement>(".social-share-btn")

  for (const btn of buttons) {
    const shareType = btn.dataset.share

    function onClick() {
      const url = encodeURIComponent(window.location.href)
      const title = encodeURIComponent(document.title)

      if (shareType === "twitter") {
        window.open(
          `https://x.com/intent/tweet?url=${url}&text=${title}`,
          "_blank",
          "width=550,height=420",
        )
      } else if (shareType === "linkedin") {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
          "_blank",
          "width=550,height=420",
        )
      } else if (shareType === "copy") {
        navigator.clipboard.writeText(window.location.href).then(() => {
          btn.classList.add("copied")
          setTimeout(() => btn.classList.remove("copied"), 2000)
        })
      }
    }

    btn.addEventListener("click", onClick)
    window.addCleanup(() => btn.removeEventListener("click", onClick))
  }
})
