import test, { describe } from "node:test"
import assert from "node:assert/strict"
import fs from "fs"
import os from "os"
import path from "path"
import {
  loadPortfolio,
  selectedPublications,
  labBadgeClass,
  projectsByYear,
  localizedPair,
} from "./portfolio"
import type { Publication, Project } from "./portfolio"

function fixtureDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-"))
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content)
  }
  return dir
}

const MIN_PROFILE = `name: Juhyeon Park
role: Undergraduate Researcher
affiliation:
  institution: { name: GIST }
bio: hello
interests: [AI]
contacts: []
`

describe("loadPortfolio", () => {
  test("loads profile and defaults missing files", () => {
    const dir = fixtureDir({ "profile.yaml": MIN_PROFILE })
    const data = loadPortfolio(dir)
    assert.equal(data.profile.name, "Juhyeon Park")
    assert.deepEqual(data.news, [])
    assert.deepEqual(data.publications, [])
    assert.deepEqual(data.projects, [])
    assert.deepEqual(data.cv, { education: [], experience: [] })
  })

  test("throws when profile.yaml is missing", () => {
    const dir = fixtureDir({})
    assert.throws(() => loadPortfolio(dir), /profile not found/)
  })

  test("parses a projects list", () => {
    const dir = fixtureDir({
      "profile.yaml": MIN_PROFILE,
      "projects.yaml": `- { name: KE Corpus, lab: LCBL }\n- { name: AgentnessArena, lab: DS Lab }\n`,
    })
    const data = loadPortfolio(dir)
    assert.equal(data.projects.length, 2)
    assert.equal(data.projects[0].name, "KE Corpus")
    assert.equal(data.projects[1].lab, "DS Lab")
  })
})

describe("selectedPublications", () => {
  const pubs: Publication[] = [
    { year: 2024, title: "A", authors: "x", venue: "v" },
    { year: 2026, title: "B", authors: "x", venue: "v", selected: true },
    { year: 2025, title: "C", authors: "x", venue: "v", selected: true },
  ]
  test("prefers selected, sorted by year desc", () => {
    assert.deepEqual(
      selectedPublications(pubs).map((p) => p.title),
      ["B", "C"],
    )
  })
  test("falls back to all when none selected, sorted by year desc", () => {
    const none = pubs.map((p) => ({ ...p, selected: false }))
    assert.deepEqual(
      selectedPublications(none).map((p) => p.title),
      ["B", "C", "A"],
    )
  })
})

describe("labBadgeClass", () => {
  test("maps known labs", () => {
    assert.equal(labBadgeClass("LCBL"), "lab-lcbl")
    assert.equal(labBadgeClass("DS Lab"), "lab-ds")
  })
  test("unknown lab gets neutral badge", () => {
    assert.equal(labBadgeClass("Other Lab"), "lab-other")
  })
})

describe("projectsByYear", () => {
  const projects: Project[] = [
    { name: "A", lab: "LCBL", year: 2025 },
    { name: "B", lab: "DS Lab", year: 2026 },
    { name: "C", lab: "LCBL", year: 2025 },
  ]
  test("groups by year, newest first, preserving order within a year", () => {
    const groups = projectsByYear(projects)
    assert.deepEqual(
      groups.map((g) => g.year),
      [2026, 2025],
    )
    assert.deepEqual(
      groups[1].items.map((p) => p.name),
      ["A", "C"],
    )
  })
  test("projects without a year fall into the 0 bucket shown last", () => {
    const groups = projectsByYear([{ name: "X", lab: "DS Lab" }, ...projects])
    assert.equal(groups[groups.length - 1].year, 0)
  })
})

describe("localizedPair", () => {
  test("wraps a plain string as identical en/ko", () => {
    assert.deepEqual(localizedPair("hello"), { en: "hello", ko: "hello" })
  })
  test("passes an { en, ko } object through unchanged", () => {
    assert.deepEqual(localizedPair({ en: "Researcher", ko: "연구생" }), {
      en: "Researcher",
      ko: "연구생",
    })
  })
})
