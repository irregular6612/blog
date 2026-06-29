import test, { describe } from "node:test"
import assert from "node:assert/strict"
import { domainOf, extractConceptRecord, aggregate, selectRecent } from "./concepts"

describe("domainOf", () => {
  test("skips the symlinked 'public' vault-root prefix", () => {
    assert.equal(domainOf("public/Statistics/Cohen's d"), "Statistics")
    assert.equal(domainOf("public/AI/Concepts/Attention"), "AI")
  })
  test("works without the public prefix", () => {
    assert.equal(domainOf("Psychology/Heuristics"), "Psychology")
  })
  test("falls back to 기타 for root-level notes", () => {
    assert.equal(domainOf("public/loose-note"), "기타")
    assert.equal(domainOf("loose-note"), "기타")
  })
})

describe("extractConceptRecord", () => {
  test("extracts a complete record", () => {
    const r = extractConceptRecord(
      { title: "Bias-Variance", Topic: "ML", "Review-Date": "2026-01-02", tags: ["ml", "stats"] },
      "public/Statistics/Bias-Variance",
    )
    assert.equal(r.title, "Bias-Variance")
    assert.equal(r.domain, "Statistics")
    assert.equal(r.topic, "ML")
    assert.equal(r.reviewDate, "2026-01-02")
    assert.deepEqual(r.tags, ["ml", "stats"])
    assert.equal(r.hasReview, true)
  })
  test("fills defaults and falls back to slug title", () => {
    const r = extractConceptRecord({}, "public/AI/Empty")
    assert.equal(r.title, "Empty")
    assert.equal(r.topic, "—")
    assert.equal(r.reviewDate, null)
    assert.equal(r.hasReview, false)
    assert.deepEqual(r.tags, [])
  })
  test("ignores malformed Review-Date", () => {
    const r = extractConceptRecord({ "Review-Date": "not-a-date" }, "public/AI/X")
    assert.equal(r.reviewDate, null)
    assert.equal(r.hasReview, false)
  })
})

describe("aggregate", () => {
  const records = [
    extractConceptRecord({ title: "A", "Review-Date": "2026-01-01", tags: ["x"] }, "public/AI/A"),
    extractConceptRecord({ title: "B" }, "public/AI/B"),
    extractConceptRecord({ title: "C", "Review-Date": "2026-02-01" }, "public/Statistics/C"),
  ]

  test("counts totals, domains, reviewed and tagged", () => {
    const a = aggregate(records)
    assert.equal(a.total, 3)
    assert.equal(a.domainCount, 2)
    assert.equal(a.withReviewCount, 2)
    assert.equal(a.taggedCount, 1)
  })

  test("byDomain is sorted by count descending", () => {
    const a = aggregate(records)
    assert.deepEqual(a.byDomain[0], { key: "AI", count: 2 })
  })
})

describe("selectRecent", () => {
  test("returns reviewed concepts newest-first, capped", () => {
    const recs = [
      extractConceptRecord({ title: "old", "Review-Date": "2025-01-01" }, "public/AI/old"),
      extractConceptRecord({ title: "new", "Review-Date": "2026-06-01" }, "public/AI/new"),
      extractConceptRecord({ title: "none" }, "public/AI/none"),
    ]
    const r = selectRecent(recs, 8)
    assert.equal(r.length, 2)
    assert.equal(r[0].title, "new")
    assert.equal(r[1].title, "old")
  })
})
