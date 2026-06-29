function setupConceptsDashboard() {
  const root = document.getElementById("concepts-dashboard")
  if (!root) return

  const search = root.querySelector<HTMLInputElement>("#concepts-search")
  const sort = root.querySelector<HTMLSelectElement>("#concepts-sort")
  const listEl = root.querySelector<HTMLElement>("#concepts-list")
  const emptyEl = root.querySelector<HTMLElement>("#concepts-empty")
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>("button.concepts-chip"))
  const rows = Array.from(root.querySelectorAll<HTMLElement>(".concepts-row"))

  const activeDomains = new Set<string>()

  function rowMatches(row: HTMLElement): boolean {
    const q = (search?.value ?? "").trim().toLowerCase()
    if (q) {
      const hay = `${row.dataset.title ?? ""} ${row.dataset.topic ?? ""} ${
        row.dataset.tags ?? ""
      }`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (activeDomains.size > 0 && !activeDomains.has(row.dataset.domain ?? "")) return false
    return true
  }

  function apply() {
    let visible = 0
    for (const row of rows) {
      const show = rowMatches(row)
      row.style.display = show ? "" : "none"
      if (show) visible++
    }
    if (emptyEl) emptyEl.style.display = visible === 0 ? "" : "none"
  }

  function applySort() {
    if (!listEl || !sort) return
    const key = sort.value
    const sorted = [...rows].sort((a, b) => {
      if (key === "title") {
        return (a.dataset.title ?? "").localeCompare(b.dataset.title ?? "")
      }
      if (key === "domain") {
        return (a.dataset.domain ?? "").localeCompare(b.dataset.domain ?? "")
      }
      // default: review date desc (blank dates sink to the bottom)
      return (b.dataset.review ?? "").localeCompare(a.dataset.review ?? "")
    })
    for (const row of sorted) listEl.appendChild(row)
  }

  for (const chip of chips) {
    const onClick = () => {
      const value = chip.dataset.filterValue ?? ""
      if (!value) return
      if (activeDomains.has(value)) {
        activeDomains.delete(value)
        chip.classList.remove("active")
      } else {
        activeDomains.add(value)
        chip.classList.add("active")
      }
      apply()
    }
    chip.addEventListener("click", onClick)
    window.addCleanup(() => chip.removeEventListener("click", onClick))
  }

  search?.addEventListener("input", apply)
  window.addCleanup(() => search?.removeEventListener("input", apply))

  const onSortChange = () => {
    applySort()
    apply()
  }
  sort?.addEventListener("change", onSortChange)
  window.addCleanup(() => sort?.removeEventListener("change", onSortChange))

  applySort()
  apply()
}

document.addEventListener("nav", setupConceptsDashboard)
