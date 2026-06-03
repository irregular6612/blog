# Research/Papers 대시보드 — 설계 문서

- **날짜**: 2026-06-03
- **작성자**: Juhyeon Park (with Claude)
- **상태**: 승인됨 (구현 계획 대기)
- **대상 레포**: `obsidian-blog` (Quartz v4, branch `v4`)

## 1. 배경 & 목표

이 블로그는 Obsidian 기반 second-brain을 Quartz v4로 GitHub Pages에 정적 배포한다.
공개 vault에는 `type: paper` 프론트매터를 가진 논문 리뷰 노트가 **538개** 있고, 그중 약 95%가
동일한 구조화 스키마(아래)를 따른다. 현재 이 데이터는 카테고리별 `.base` 테이블로만 노출되어
있어, **전 논문을 횡단하는 개요/집계 레이어가 없다.**

**목표**: `/papers` 단일 랜딩 페이지를 추가한다. 두 가지를 동시에 만족한다.
1. **Showcase** — 방문자에게 "체계적으로 논문을 읽고 평가하는 연구자"라는 인상.
2. **Second-brain 탐색** — 본인이 538개 논문을 통계·필터·스포트라이트로 빠르게 둘러봄.

**비목표**: 독자 모집(댓글/SEO), 의미 검색, 실험 로그 뷰어 — 모두 별도 트랙.

## 2. 제약 (배포 아키텍처에서 도출)

배포 파이프라인: Obsidian vault → `blog-content` 레포 → GitHub Actions 빌드 → GitHub Pages.
`repository_dispatch: content-updated` 이벤트로 재빌드된다.

→ **모든 기능은 정적/빌드타임/클라이언트사이드여야 한다.** 런타임 서버·DB·외부 API 호출 금지.
→ 클라이언트로 나가는 코드는 가벼워야 한다. **차트 라이브러리·프레임워크 추가 금지.**

## 3. 데이터 모델

### 3.1 소스 스키마 (paper 노트 프론트매터)

```yaml
Reading-Status: ☑️ Not Started | ▶️ In progress | ✅ Done
Author: <string>
Journal/Conference: <string>
Published Year: <int>
Topic: <string>
Review-Date: <YYYY-MM-DD>
URL: <string>
arXiv-ID: <string>
DOI: <string>
Category: <string>   # 상위 10종 + 롱테일 ~15종
Evidence-Quality: A | B | C | D
Reproducibility: A | B | C | D
linked-bases: "[[X.base]]"
type: paper
```

### 3.2 실측 분포 (2026-06-03 기준, 538 papers)

- **필드 완전성**: Topic/URL/Review-Date/Reading-Status/Published Year/Category/Author ≈ 510 (95%),
  arXiv-ID 498, Evidence-Quality/Reproducibility 493. → 약 5%는 일부 필드 누락.
- **Category**: Application 179 · Benchmark/Evaluation 115 · Architecture 66 · Theory 45 ·
  Training 30 · Reasoning 21 · Survey 14 · Optimization 12 · Dataset 8 · AGI 7 · (롱테일 ~15종 각 1~3개).
- **Published Year**: 2024(142) · 2025(141) · 2023(63) · 2026(27) · 2019(21) · … · 2009까지 분포.
- **Evidence-Quality**: A 84 · B 91 · C 318.
- **Reproducibility**: A 65 · B 84 · C 338 · D 6.
- **Reading-Status**: Not Started(다수) · In progress(약 32) · Done(약 11). (인라인/리스트 표기 혼용)

### 3.3 추출 대상 (빌드타임)

각 paper 노트에서 추출하는 정규화 레코드:

```ts
interface PaperRecord {
  title: string        // file.name (확장자 제거)
  slug: string         // 노트 페이지 링크용 FullSlug
  author: string       // Author, 누락 시 "—"
  year: number | null  // Published Year, 파싱 실패 시 null
  category: string     // 상위 8개 원본 유지, 그 외 → "Other"
  rawCategory: string  // 원본 Category (툴팁/디버그용)
  topic: string
  status: "Not Started" | "In progress" | "Done" | "Unknown"  // 이모지/표기 정규화
  reviewDate: string | null  // YYYY-MM-DD
  evidence: "A" | "B" | "C" | "D" | "Unknown"
  reproducibility: "A" | "B" | "C" | "D" | "Unknown"
  url: string | null
  arxivId: string | null
}
```

- **결측 처리**: 모든 접근은 옵셔널 체이닝. 누락 → 표시 `"—"`, 필터 버킷 `"Unknown"`. 빌드는 절대 깨지지 않는다.
- **Category 버킷팅**: `TOP_CATEGORIES = [Application, Benchmark/Evaluation, Architecture, Theory, Training, Reasoning, Survey, Optimization]` (8개). 그 외 전부 `Other`. **원본 노트는 수정하지 않는다.**
- **Reading-Status 정규화**: 이모지·대소문자·공백 차이를 흡수해 4개 값(위)으로 매핑.

## 4. 아키텍처

`BasesPage` emitter 패턴을 복제한다 (`allFiles`를 받아 `file.frontmatter?.[...]`로 필터·집계 후 페이지 emit).

### 4.1 신규 파일

| 파일 | 역할 |
|---|---|
| `quartz/plugins/emitters/papersDashboard.tsx` | 빌드 시 `allFiles`에서 `type: paper` 필터 → 집계 → `/papers` 슬러그로 페이지 emit |
| `quartz/util/papers.ts` | **순수 함수** 모듈: `extractPaperRecord()`, `bucketCategory()`, `normalizeStatus()`, `aggregate()` (통계/차트 데이터), `selectSpotlight()`. 렌더·IO 없음 → 단위 테스트 대상 |
| `quartz/components/PapersDashboard.tsx` | 집계 결과를 SSR(Preact). 통계 카드 + SVG 막대 차트 + 스포트라이트 + 리스트 + 임베드 JSON 인덱스 |
| `quartz/components/styles/papersDashboard.scss` | 스타일 (테마 색상 변수 사용) |
| `quartz/components/scripts/papersDashboard.inline.ts` | 임베드 JSON 위에서 검색·필터칩·정렬 (의존성 0, vanilla DOM) |
| `quartz/util/papers.test.ts` | 집계 순수 함수 단위 테스트 (Node 네이티브 러너) |

### 4.2 변경 파일

- `quartz.config.ts` — emitters 배열에 `Plugin.PapersDashboard()` 추가.
- `quartz/plugins/emitters/index.ts` (및 필요 시 `quartz/components/index.ts`) — export 등록.
- `content/index.md` — 본문에 `📚 [Papers 대시보드](/papers)` 링크 1줄 추가 (접근 경로 (a) 결정).

### 4.3 데이터 흐름

```
build.ts (parse → filter → emit)
  └─ PapersDashboard.emit(ctx, content, allFiles, ...)
       ├─ allFiles.filter(f => f.frontmatter?.type === "paper")
       ├─ map → extractPaperRecord()        // quartz/util/papers.ts
       ├─ aggregate(records)                // 통계 + 차트 버킷
       ├─ selectSpotlight(records)          // In progress + Review-Date desc, 상위 6
       └─ renderPage(<PapersDashboard data records aggregate spotlight />)
              └─ emit "/papers" HTML  +  <script> JSON 인덱스 임베드
                     └─ papersDashboard.inline.ts 가 클라이언트 필터링
```

## 5. 페이지 사양 (C-Hybrid · 심플 차트 스트립)

1. **컴팩트 스탯 줄**: `Papers(538)` · `Done+Reading` · `Evidence A` · `Categories` · `Year span(’17–’26)`. 빌드타임 집계값.
2. **차트 스트립** (순수 inline SVG/CSS, 라이브러리 0):
   - *By Category*: 상위 8개 + Other 가로 막대.
   - *By Year*: 연도별 가로 막대 (오래된 연도는 묶어서 `≤YYYY` 가능).
3. **스포트라이트**: `status === "In progress"`를 `reviewDate` 내림차순 정렬, 상위 6개 카드 (제목 + 상태 배지 + 리뷰일).
4. **전체 리스트**:
   - 컬럼: Title(링크) · Year · Category 배지 · Evidence 칩 · arXiv 배지(외부 링크).
   - **검색**: title + author 부분일치 (클라이언트).
   - **필터칩**: Category · Year · Reading-Status · Evidence-Quality(≥ 기준). 다중 선택, 칩 토글.
   - **정렬**: Year / Review-Date / Title.
   - 행 클릭 → 노트 페이지(`slug`), arXiv 배지 클릭 → 외부 `URL`.

### 5.1 클라이언트 상호작용

- 페이지에 `PaperRecord[]` JSON(538행, 약 100KB 추정)을 `<script type="application/json">`으로 임베드.
- `papersDashboard.inline.ts`가 파싱 후 검색/필터/정렬을 메모리에서 처리, 리스트 DOM만 갱신.
- **차트 스트립과 통계 카드는 정적**(전체 집계 기준) — 필터에 따라 갱신하지 않는다 (YAGNI, 추후 확장 여지).

## 6. 테스트 전략

렌더링이 아니라 **집계 로직**을 테스트한다. `quartz/util/papers.ts`의 순수 함수 대상:

- `extractPaperRecord()` — 완전한 프론트매터 / 필드 누락 / 잘못된 Year → 올바른 레코드·결측 처리.
- `bucketCategory()` — 상위 8개 보존, 롱테일 → `Other`.
- `normalizeStatus()` — 이모지·표기 변형 → 4개 정규값.
- `aggregate()` — 카테고리/연도/품질 카운트 정확성.
- `selectSpotlight()` — In progress 필터 + Review-Date 정렬 + 상위 N.

`quartz/util/papers.test.ts`, Node 네이티브 러너(`node:test`/`node:assert`). 빌드 비파괴(결측 입력에도 throw 없음) 케이스 포함.

## 7. 마이크로 결정 (확정)

- **(a) 접근 링크**: `content/index.md` 본문에 `/papers` 링크 추가. (Footer/네비 변경은 하지 않음 — 최소 변경)
- **(b) Category 정규화**: 이번 범위 제외. `Other` 버킷으로 처리하고 원본 노트는 불변.

## 8. 명시적 비범위 (YAGNI)

- ❌ 클라이언트 의미/임베딩 검색
- ❌ 차트 라이브러리 (D3/Chart.js 등)
- ❌ Evidence × Reproducibility 히트맵 (심플 스트립 선택)
- ❌ jsonl 실험 로그 인터랙티브 뷰어
- ❌ 원본 paper 노트 자동 정규화/수정
- ❌ 필터 연동형 동적 차트 갱신
- ❌ 댓글·SEO·RSS 등 독자용 기능 (별도 트랙)

## 9. 리스크 & 완화

| 리스크 | 완화 |
|---|---|
| 5% 노트의 필드 누락으로 빌드 깨짐 | 모든 접근 옵셔널 체이닝 + 결측 → `"—"`/`"Unknown"`, throw 금지. 테스트로 강제 |
| Reading-Status 이모지/표기 혼용 | `normalizeStatus()`에서 흡수, 미매칭은 `"Unknown"` |
| 임베드 JSON 크기 증가 | 필요한 필드만 추출(요약 레코드). 538행 ≈ 100KB로 허용 범위. 초과 시 본문 abstract 제외 유지 |
| `file.name` 기반 title의 확장자/특수문자 | 추출 시 정제, slug는 Quartz 기존 헬퍼 사용 |

## 10. 향후 확장 여지 (이번엔 안 함)

- BibTeX export 버튼 (개별 노트 + 대시보드 일괄)
- 한국어 검색 토크나이징 개선
- Category 정규화 + Topic 태그 브라우징
- Reading-Status/Review-Date 기반 복습 큐
