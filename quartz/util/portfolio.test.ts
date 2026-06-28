import test, { describe } from "node:test"
import assert from "node:assert/strict"
import fs from "fs"
import os from "os"
import path from "path"
import { loadPortfolio, selectedPublications, labBadgeClass } from "./portfolio"
import type { Publication } from "./portfolio"

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
