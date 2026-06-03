type Group = "category" | "status" | "evidence"

function setupPapersDashboard() {
  const root = document.getElementById("papers-dashboard")
  if (!root) return

  const search = root.querySelector<HTMLInputElement>("#papers-search")
  const sort = root.querySelector<HTMLSelectElement>("#papers-sort")
  const listEl = root.querySelector<HTMLElement>("#papers-list")
  const emptyEl = root.querySelector<HTMLElement>("#papers-empty")
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>("button.papers-chip"))
  const rows = Array.from(root.querySelectorAll<HTMLElement>(".papers-row"))

  const active: Record<Group, Set<string>> = {
    category: new Set(),
    status: new Set(),
    evidence: new Set(),
  }

  function rowMatches(row: HTMLElement): boolean {
    const q = (search?.value ?? "").trim().toLowerCase()
    if (q) {
      const hay = `${row.dataset.title ?? ""} ${row.dataset.author ?? ""}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    for (const group of ["category", "status", "evidence"] as Group[]) {
      const set = active[group]
      if (set.size > 0 && !set.has(row.dataset[group] ?? "")) return false
    }
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
      if (key === "review") {
        return (b.dataset.review ?? "").localeCompare(a.dataset.review ?? "")
      }
      // default: year desc
      return Number(b.dataset.year ?? "0") - Number(a.dataset.year ?? "0")
    })
    for (const row of sorted) listEl.appendChild(row)
  }

  for (const chip of chips) {
    const onClick = () => {
      const group = chip.dataset.filterGroup as Group
      const value = chip.dataset.filterValue ?? ""
      if (!group) return
      if (active[group].has(value)) {
        active[group].delete(value)
        chip.classList.remove("active")
      } else {
        active[group].add(value)
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

document.addEventListener("nav", setupPapersDashboard)
