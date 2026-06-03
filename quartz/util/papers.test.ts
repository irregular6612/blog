import test, { describe } from "node:test"
import assert from "node:assert/strict"
import {
  normalizeStatus,
  normalizeGrade,
  bucketCategory,
  parseYear,
  extractPaperRecord,
  aggregate,
  selectSpotlight,
  TOP_CATEGORIES,
} from "./papers"

describe("normalizeStatus", () => {
  test("maps emoji list values to canonical status", () => {
    assert.equal(normalizeStatus(["▶️ In progress"]), "In progress")
    assert.equal(normalizeStatus(["✅ Done"]), "Done")
    assert.equal(normalizeStatus(["☑️ Not Started"]), "Not Started")
  })
  test("accepts plain strings case-insensitively", () => {
    assert.equal(normalizeStatus("in progress"), "In progress")
    assert.equal(normalizeStatus("DONE"), "Done")
  })
  test("missing or unknown becomes Unknown", () => {
    assert.equal(normalizeStatus(undefined), "Unknown")
    assert.equal(normalizeStatus("foo"), "Unknown")
    assert.equal(normalizeStatus([]), "Unknown")
  })
})

describe("normalizeGrade", () => {
  test("normalizes A-D", () => {
    assert.equal(normalizeGrade("A"), "A")
    assert.equal(normalizeGrade("c"), "C")
  })
  test("missing or invalid becomes Unknown", () => {
    assert.equal(normalizeGrade(undefined), "Unknown")
    assert.equal(normalizeGrade("E"), "Unknown")
  })
})

describe("bucketCategory", () => {
  test("keeps a top category as-is", () => {
    assert.equal(bucketCategory("Application"), "Application")
  })
  test("buckets long-tail and missing into Other", () => {
    assert.equal(bucketCategory("AI Bias / Political Bias"), "Other")
    assert.equal(bucketCategory(undefined), "Other")
  })
})

describe("parseYear", () => {
  test("parses numbers and numeric strings", () => {
    assert.equal(parseYear(2024), 2024)
    assert.equal(parseYear("2019"), 2019)
  })
  test("returns null for junk", () => {
    assert.equal(parseYear("N/A"), null)
    assert.equal(parseYear(undefined), null)
  })
})

describe("extractPaperRecord", () => {
  const fm = {
    title: "Attention Is All You Need",
    Author: "Vaswani et al.",
    "Published Year": 2017,
    Topic: "Architecture",
    "Reading-Status": ["✅ Done"],
    "Review-Date": "2025-01-02",
    "Evidence-Quality": "A",
    Reproducibility: "B",
    URL: "https://arxiv.org/abs/1706.03762",
    "arXiv-ID": "1706.03762",
    Category: "Architecture",
  }

  test("extracts a complete record", () => {
    const r = extractPaperRecord(fm, "AI/Papers/Attention")
    assert.equal(r.title, "Attention Is All You Need")
    assert.equal(r.slug, "AI/Papers/Attention")
    assert.equal(r.year, 2017)
    assert.equal(r.category, "Architecture")
    assert.equal(r.status, "Done")
    assert.equal(r.evidence, "A")
    assert.equal(r.reproducibility, "B")
    assert.equal(r.arxivId, "1706.03762")
  })

  test("does not throw and fills defaults when fields are missing", () => {
    const r = extractPaperRecord({}, "AI/Papers/Empty")
    assert.equal(r.title, "Empty")
    assert.equal(r.author, "—")
    assert.equal(r.year, null)
    assert.equal(r.category, "Other")
    assert.equal(r.status, "Unknown")
    assert.equal(r.evidence, "Unknown")
    assert.equal(r.url, null)
  })
})

describe("aggregate", () => {
  const records = [
    extractPaperRecord(
      {
        title: "A",
        "Published Year": 2024,
        Category: "Application",
        "Reading-Status": ["✅ Done"],
        "Evidence-Quality": "A",
      },
      "a",
    ),
    extractPaperRecord(
      {
        title: "B",
        "Published Year": 2024,
        Category: "Application",
        "Reading-Status": ["▶️ In progress"],
        "Evidence-Quality": "C",
      },
      "b",
    ),
    extractPaperRecord(
      {
        title: "C",
        "Published Year": 2019,
        Category: "Weird One-Off",
        "Reading-Status": ["☑️ Not Started"],
      },
      "c",
    ),
  ]

  test("computes headline counts", () => {
    const a = aggregate(records)
    assert.equal(a.total, 3)
    assert.equal(a.doneCount, 1)
    assert.equal(a.inProgressCount, 1)
    assert.equal(a.evidenceACount, 1)
    assert.equal(a.yearMin, 2019)
    assert.equal(a.yearMax, 2024)
  })

  test("byCategory counts buckets and puts Other last", () => {
    const a = aggregate(records)
    assert.deepEqual(a.byCategory[0], { key: "Application", count: 2 })
    assert.equal(a.byCategory[a.byCategory.length - 1].key, "Other")
  })

  test("byYear is sorted descending by year", () => {
    const a = aggregate(records)
    assert.deepEqual(
      a.byYear.map((b) => b.key),
      ["2024", "2019"],
    )
    assert.equal(a.byYear[0].count, 2)
  })
})

describe("selectSpotlight", () => {
  test("returns only In progress, newest Review-Date first, capped", () => {
    const recs = [
      extractPaperRecord(
        { title: "old", "Reading-Status": ["▶️ In progress"], "Review-Date": "2025-01-01" },
        "old",
      ),
      extractPaperRecord(
        { title: "new", "Reading-Status": ["▶️ In progress"], "Review-Date": "2025-06-01" },
        "new",
      ),
      extractPaperRecord(
        { title: "done", "Reading-Status": ["✅ Done"], "Review-Date": "2025-09-01" },
        "done",
      ),
    ]
    const s = selectSpotlight(recs, 6)
    assert.equal(s.length, 2)
    assert.equal(s[0].title, "new")
    assert.equal(s[1].title, "old")
  })
})

describe("TOP_CATEGORIES", () => {
  test("has the eight known buckets", () => {
    assert.equal(TOP_CATEGORIES.length, 8)
    assert.ok(TOP_CATEGORIES.includes("Application"))
  })
})
