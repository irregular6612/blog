// Concept dashboard model. Unlike papers, concept notes carry no `Category`
// frontmatter field — they are organized by the top-level vault folder they live
// in (AI, Psychology, Statistics, …), so the folder is the grouping axis here.

export interface ConceptRecord {
  title: string
  slug: string
  domain: string
  topic: string
  reviewDate: string | null
  tags: string[]
  hasReview: boolean
}

export interface CountBucket {
  key: string
  count: number
}

export interface ConceptAggregate {
  total: number
  domainCount: number
  withReviewCount: number
  taggedCount: number
  byDomain: CountBucket[]
}

export interface ConceptDashboardData {
  records: ConceptRecord[]
  aggregate: ConceptAggregate
  recent: ConceptRecord[]
}

function firstValue(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw.length > 0 ? String(raw[0]) : ""
  }
  return raw == null ? "" : String(raw)
}

function asArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((v) => String(v)).filter((v) => v.length > 0)
  const v = firstValue(raw).trim()
  return v.length > 0 ? [v] : []
}

function slugTitle(slug: string): string {
  const last = slug.split("/").pop() ?? slug
  return last.length > 0 ? last : slug
}

// The vault is symlinked under content/public, so every slug is prefixed with
// "public/". The domain is the first real folder after that prefix. Falls back
// to "기타" when a note sits directly at the vault root.
export function domainOf(slug: string): string {
  const parts = slug.split("/").filter((p) => p.length > 0 && p !== "public")
  return parts.length > 1 ? parts[0] : "기타"
}

export function extractConceptRecord(
  frontmatter: Record<string, unknown>,
  slug: string,
): ConceptRecord {
  const fm = frontmatter ?? {}
  const title = firstValue(fm["title"]) || slugTitle(slug)
  const topic = firstValue(fm["Topic"]) || "—"
  const reviewDateRaw = firstValue(fm["Review-Date"])
  const reviewDate = /^\d{4}-\d{2}-\d{2}$/.test(reviewDateRaw) ? reviewDateRaw : null
  const tags = asArray(fm["tags"])

  return {
    title,
    slug,
    domain: domainOf(slug),
    topic,
    reviewDate,
    tags,
    hasReview: reviewDate != null,
  }
}

function countBy(records: ConceptRecord[], key: (r: ConceptRecord) => string): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of records) {
    const k = key(r)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

export function aggregate(records: ConceptRecord[]): ConceptAggregate {
  const domMap = countBy(records, (r) => r.domain)
  const byDomain: CountBucket[] = [...domMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total: records.length,
    domainCount: byDomain.length,
    withReviewCount: records.filter((r) => r.hasReview).length,
    taggedCount: records.filter((r) => r.tags.length > 0).length,
    byDomain,
  }
}

// Most-recently-reviewed concepts, newest first, for the spotlight strip.
export function selectRecent(records: ConceptRecord[], limit = 8): ConceptRecord[] {
  return records
    .filter((r) => r.reviewDate != null)
    .sort((a, b) => (b.reviewDate ?? "").localeCompare(a.reviewDate ?? ""))
    .slice(0, limit)
}

declare module "vfile" {
  interface DataMap {
    conceptsData: ConceptDashboardData
  }
}
