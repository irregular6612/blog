export type QualityGrade = "A" | "B" | "C" | "D" | "Unknown"
export type ReadingStatus = "Not Started" | "In progress" | "Done" | "Unknown"

export interface PaperRecord {
  title: string
  slug: string
  author: string
  year: number | null
  category: string
  rawCategory: string
  topic: string
  status: ReadingStatus
  reviewDate: string | null
  evidence: QualityGrade
  reproducibility: QualityGrade
  url: string | null
  arxivId: string | null
}

export interface CountBucket {
  key: string
  count: number
}

// Per-category reading progress. `read` = done + inProgress (the papers the
// user has actually engaged with); the dashboard bars are scaled to `read`.
export interface CategoryProgress {
  key: string
  done: number
  inProgress: number
  notStarted: number
  read: number
  total: number
}

export interface PaperAggregate {
  total: number
  doneCount: number
  inProgressCount: number
  evidenceACount: number
  categoryCount: number
  yearMin: number | null
  yearMax: number | null
  byCategory: CountBucket[]
  byCategoryProgress: CategoryProgress[]
  byYear: CountBucket[]
}

export interface DashboardData {
  records: PaperRecord[]
  aggregate: PaperAggregate
  spotlight: PaperRecord[]
}

export const TOP_CATEGORIES = [
  "Application",
  "Benchmark/Evaluation",
  "Architecture",
  "Theory",
  "Training",
  "Reasoning",
  "Survey",
  "Optimization",
  "AGI",
  "Dataset",
] as const

const OTHER = "Other"

function firstValue(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw.length > 0 ? String(raw[0]) : ""
  }
  return raw == null ? "" : String(raw)
}

export function normalizeStatus(raw: unknown): ReadingStatus {
  const v = firstValue(raw).toLowerCase()
  if (v.includes("progress")) return "In progress"
  if (v.includes("done") || v.includes("✅")) return "Done"
  if (v.includes("not started") || v.includes("☑")) return "Not Started"
  return "Unknown"
}

export function normalizeGrade(raw: unknown): QualityGrade {
  const v = firstValue(raw).trim().toUpperCase().charAt(0)
  return v === "A" || v === "B" || v === "C" || v === "D" ? v : "Unknown"
}

export function bucketCategory(raw: unknown): string {
  const v = firstValue(raw).trim()
  return (TOP_CATEGORIES as readonly string[]).includes(v) ? v : OTHER
}

export function parseYear(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : parseInt(firstValue(raw), 10)
  return Number.isFinite(n) && n > 1900 && n < 2100 ? n : null
}

function slugTitle(slug: string): string {
  const last = slug.split("/").pop() ?? slug
  return last.length > 0 ? last : slug
}

export function extractPaperRecord(
  frontmatter: Record<string, unknown>,
  slug: string,
): PaperRecord {
  const fm = frontmatter ?? {}
  const rawCategory = firstValue(fm["Category"])
  const title = firstValue(fm["title"]) || slugTitle(slug)
  const author = firstValue(fm["Author"]) || "—"
  const topic = firstValue(fm["Topic"]) || "—"
  const url = firstValue(fm["URL"]) || null
  const arxivId = firstValue(fm["arXiv-ID"]) || null
  const reviewDateRaw = firstValue(fm["Review-Date"])
  const reviewDate = /^\d{4}-\d{2}-\d{2}$/.test(reviewDateRaw) ? reviewDateRaw : null

  return {
    title,
    slug,
    author,
    year: parseYear(fm["Published Year"]),
    category: bucketCategory(rawCategory),
    rawCategory: rawCategory || "—",
    topic,
    status: normalizeStatus(fm["Reading-Status"]),
    reviewDate,
    evidence: normalizeGrade(fm["Evidence-Quality"]),
    reproducibility: normalizeGrade(fm["Reproducibility"]),
    url,
    arxivId,
  }
}

function countBy(records: PaperRecord[], key: (r: PaperRecord) => string): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of records) {
    const k = key(r)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

export function aggregate(records: PaperRecord[]): PaperAggregate {
  const years = records.map((r) => r.year).filter((y): y is number => y != null)

  const catMap = countBy(records, (r) => r.category)
  const byCategory: CountBucket[] = [...catMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => {
      if (a.key === OTHER) return 1
      if (b.key === OTHER) return -1
      return b.count - a.count
    })

  // Reading progress per category — only Done + In progress count as "read".
  // Categories with zero read papers are dropped so the chart stays focused on
  // what's actually been engaged with. Sorted by read volume, Other last.
  const byCategoryProgress: CategoryProgress[] = byCategory
    .map(({ key }) => {
      const inCat = records.filter((r) => r.category === key)
      const done = inCat.filter((r) => r.status === "Done").length
      const inProgress = inCat.filter((r) => r.status === "In progress").length
      const notStarted = inCat.filter((r) => r.status === "Not Started").length
      return { key, done, inProgress, notStarted, read: done + inProgress, total: inCat.length }
    })
    .filter((c) => c.read > 0)
    .sort((a, b) => {
      if (a.key === OTHER) return 1
      if (b.key === OTHER) return -1
      return b.read - a.read
    })

  const yearMap = countBy(
    records.filter((r) => r.year != null),
    (r) => String(r.year),
  )
  const byYear: CountBucket[] = [...yearMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => Number(b.key) - Number(a.key))

  return {
    total: records.length,
    doneCount: records.filter((r) => r.status === "Done").length,
    inProgressCount: records.filter((r) => r.status === "In progress").length,
    evidenceACount: records.filter((r) => r.evidence === "A").length,
    categoryCount: byCategory.length,
    yearMin: years.length ? Math.min(...years) : null,
    yearMax: years.length ? Math.max(...years) : null,
    byCategory,
    byCategoryProgress,
    byYear,
  }
}

export function selectSpotlight(records: PaperRecord[], limit = 6): PaperRecord[] {
  return records
    .filter((r) => r.status === "In progress")
    .sort((a, b) => (b.reviewDate ?? "").localeCompare(a.reviewDate ?? ""))
    .slice(0, limit)
}

declare module "vfile" {
  interface DataMap {
    papersData: DashboardData
  }
}
