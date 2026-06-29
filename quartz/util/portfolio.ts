import fs from "fs"
import path from "path"
import yaml from "js-yaml"

export interface Contact {
  kind: string
  label: string
  href: string
  soon?: boolean
}

export interface Affiliation {
  lab?: { name: string; url?: string }
  pi?: { name: string; url?: string }
  institution?: { name: string; url?: string; country?: string }
}

export interface Profile {
  name: string
  role: string
  affiliation: Affiliation
  bio: string
  about?: string
  photo?: string
  interests: string[]
  contacts: Contact[]
}

export interface NewsItem {
  date: string | number
  html: string
}

export interface PublicationLinks {
  pdf?: string
  code?: string
  doi?: string
}

export interface Publication {
  year: number
  // Optional human-friendly date (e.g. "Aug 2026"). Falls back to `year` for
  // display; `year` is always used for sorting.
  date?: string
  title: string
  authors: string
  venue: string
  links?: PublicationLinks
  selected?: boolean
}

export interface Project {
  name: string
  lab: string
  desc?: string
  url?: string
  authors?: string
  venue?: string
  year?: number
  // Paper/PDF link. Empty or absent → the button renders disabled (placeholder).
  paper?: string
  abstractKo?: string
  abstractEn?: string
}

export interface Talk {
  title: string
  event?: string
  date?: string
  slides?: string
}

export interface Award {
  title: string
  org?: string
  year?: string | number
}

export interface CVEntry {
  period: string
  role?: string
  degree?: string
  field?: string
  org: string
  url?: string
}

export interface CVData {
  pdf?: string
  education: CVEntry[]
  experience: CVEntry[]
}

export interface PortfolioData {
  profile: Profile
  news: NewsItem[]
  publications: Publication[]
  projects: Project[]
  talks: Talk[]
  awards: Award[]
  cv: CVData
}

const EMPTY_CV: CVData = { education: [], experience: [] }

function readYaml<T>(dir: string, file: string, fallback: T): T {
  const fp = path.join(dir, file)
  if (!fs.existsSync(fp)) return fallback
  const parsed = yaml.load(fs.readFileSync(fp, "utf-8"))
  return (parsed ?? fallback) as T
}

export function loadPortfolio(dataDir: string = path.join(process.cwd(), "data")): PortfolioData {
  const profile = readYaml<Profile | null>(dataDir, "profile.yaml", null)
  if (!profile) {
    throw new Error(`Portfolio profile not found at ${path.join(dataDir, "profile.yaml")}`)
  }
  return {
    profile,
    news: readYaml<NewsItem[]>(dataDir, "news.yaml", []),
    publications: readYaml<Publication[]>(dataDir, "publications.yaml", []),
    projects: readYaml<Project[]>(dataDir, "projects.yaml", []),
    talks: readYaml<Talk[]>(dataDir, "talks.yaml", []),
    awards: readYaml<Award[]>(dataDir, "awards.yaml", []),
    cv: readYaml<CVData>(dataDir, "cv.yaml", EMPTY_CV),
  }
}

export function selectedPublications(pubs: Publication[]): Publication[] {
  const sel = pubs.filter((p) => p.selected)
  const chosen = sel.length > 0 ? sel : pubs
  return chosen.slice().sort((a, b) => b.year - a.year)
}

// Group projects by year, newest year first. Items keep their original order
// within each year. Projects without a year fall into a 0 bucket shown last.
export function projectsByYear(projects: Project[]): { year: number; items: Project[] }[] {
  const groups = new Map<number, Project[]>()
  for (const p of projects) {
    const y = p.year ?? 0
    const arr = groups.get(y) ?? []
    arr.push(p)
    groups.set(y, arr)
  }
  return [...groups.entries()].sort((a, b) => b[0] - a[0]).map(([year, items]) => ({ year, items }))
}

export function labBadgeClass(lab: string): "lab-lcbl" | "lab-ds" | "lab-other" {
  const key = lab.trim().toLowerCase()
  if (key === "lcbl") return "lab-lcbl"
  if (key === "ds lab" || key === "dslab") return "lab-ds"
  return "lab-other"
}

declare module "vfile" {
  interface DataMap {
    portfolioData?: PortfolioData
  }
}
