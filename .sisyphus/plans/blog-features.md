# 블로그 기능 개선 워크플랜

> Quartz v4 기반 Obsidian 블로그에 이미지 갤러리, 검색 개선, 관련 게시물, 필터링 기능 추가

**요약**: 기존 RecentNotes와 Canvas 기능을 개선하고, 이미지 라이트박스, 검색 개선, 관련 게시물 추천, 태그 필터링 기능을 추가합니다.

**예상 규모**: 중간 (Medium) - 13개 작업 (Wave 0-4), 병렬 실행 가능
**병렬 실행**: 예 - 5개 웨이브로 그룹화
**핵심 경로**: LSP 수정 → Canvas 임베드 → 이미지 갤러리 → 관련 게시물

---

## 컨텍스트

### 원래 요청

Obsidian으로 작성한 문서를 기반으로 한 Quartz v4 블로그에 다음 기능 추가:

1. 최근 게시물 기능 개선
2. .CANVAS 파일 지원 (전체 화면 + 임베드)
3. 이미지 갤러리/라이트박스
4. 검색 기능 개선
5. 관련 게시물 추천
6. 게시물 필터링/카테고리

### 인터뷰 결과

- **콘텐츠 위치**: `content/` 폴더
- **Canvas 표시**: 전체 화면 페이지 + 게시물 내 임베드 둘 다 지원
- **정렬**: 최신 날짜 순 (생성일/수정일 기준)
- **우선순위**: 이미지 갤러리 > 검색 개선 > 관련 게시물 > 필터링

### 현재 구현 상태 (Metis 분석)

| 기능               | 상태         | 비고                                |
| ------------------ | ------------ | ----------------------------------- |
| RecentNotes        | ✅ 구현됨    | 홈페이지에 5개 표시, 작동 확인 필요 |
| Canvas 전체 페이지 | ✅ 구현됨    | CanvasPage emitter/renderer 완료    |
| Canvas 임베드      | ⚠️ 부분 구현 | Transformer 누락, 통합 필요         |
| 이미지 갤러리      | ❌ 미구현    | 신규 개발 필요                      |
| 검색 개선          | ⚠️ 기본 구현 | Fuse.js 기반, 튜닝 필요             |
| 관련 게시물        | ❌ 미구현    | 신규 개발 필요                      |
| 태그 필터링        | ⚠️ 부분 구현 | Tag 페이지 존재, UI 개선 필요       |

### 사용자 결정 사항 (승인됨)

**Wave 0에서 구현 예정**:

1. **Canvas UI 언어**: 한국어 유지 ("확대", "축소", "초기화")
2. **이미지 라이트박스 디자인**:
   - 배경: 어둡게 (var(--dark) 90%)
   - 화살표 네비게이션: 지원
   - 확대/축소: 미지원 (단순하게)
3. **관련 게시물 알고리즘**:
   - 기준: 공유 태그 수 내림차순
   - 동점 처리: 최신 날짜 우선
   - 최대 개수: 5개
   - 자기 자신: 제외

### Metis 리뷰 - 식별된 갭

**해결됨**:

- CanvasNode 인터페이스 중복 (3개 파일) → 리팩토링 작업 포함
- Canvas 임베드 transformer 누락 → 신규 개발 작업 포함

**추가 작업 (LSP 오류 수정)**:

- 기존 코드에서 10개 LSP 오류 발견 → Wave 0에서 함께 수정
- 수락 기준 부재 → 각 작업별 실행 가능한 검증 절차 포함

**사용자 결정 필요**:

1. **Canvas UI 언어**: CanvasPage.tsx에 한국어 문자열 있음 ("확대", "축소", "초기화")
2. **이미지 라이트박스 디자인**: 배경 흐림? 화살표 네비게이션? 확대/축소?
3. **관련 게시물 알고리즘**: 공유 태그 기준? 링크 기준? 날짜 가중치?

---

## 작업 목표

### 핵심 목표

기존 기능을 개선하고 4가지 주요 기능을 추가하여 블로그의 사용자 경험과 콘텐츠 탐색성 향상

### 구체적 결과물

1. **개선된 RecentNotes**: 날짜 순 정렬 검증, 옵션 문서화
2. **완성된 Canvas 지원**: 전체 화면 + 임베드 (`![[file.canvas]]`)
3. **ImageLightbox 컴포넌트**: 모든 마크다운 이미지 클릭 시 라이트박스
4. **개선된 Search**: 검색 결과 개선, 키보드 네비게이션
5. **RelatedPosts 컴포넌트**: 태그 기반 관련 게시물 추천
6. **TagFilter 개선**: 태그 기반 필터링 UI

### 완료 기준

- [ ] 모든 기능이 `npm run check` 통과
- [ ] 각 기능별 Playwright 테스트 통과
- [ ] 실제 콘텐츠로 수동 검증 완료

### 필수 포함

- 기존 RecentNotes, Canvas 기능 보존
- Obsidian 호환성 유지 (마크다운 문법)
- Preact + TypeScript 패턴 준수
- 접근성 (키보드 네비게이션, ARIA)

### 제외 사항 (가드레일)

- 이미지 업로드/편집 UI (Obsidian에서 처리)
- 검색 분석/추적
- ML 기반 추천 시스템
- 중첩 카테고리 (태그만 사용)
- 복잡한 검색 필터 (날짜 범위 등)

---

## 검증 전략

### 테스트 인프라

- **인프라 존재**: 예 (Node.js native test runner)
- **테스트 원함**: 예 (TDD 스타일)
- **프레임워크**: node:test + node:assert (기존 패턴)

### TDD 적용

각 작업은 RED-GREEN-REFACTOR 주기를 따름:

1. **RED**: 실패하는 테스트 작성
2. **GREEN**: 최소한의 구현으로 테스트 통과
3. **REFACTOR**: 코드 정리, 테스트 유지

### 검증 도구

- **프론트엔드**: Playwright 브라우저 자동화
- **CLI/빌드**: Bash 명령어 (grep, find 등)
- **타입 검증**: `npm run check` (tsc + prettier)
- **테스트 실행**: `npx tsx --test path/to/file.test.ts`

---

## 실행 전략

### 병렬 실행 웨이브

```
Wave 0 (사전 작업 - 즉시 시작):
└── Task 0: 기존 LSP 오류 10개 수정

Wave 1 (기반 개선 - Wave 0 완료 후):
├── Task 1: RecentNotes 검증 및 개선
├── Task 2: Canvas 리팩토링 (중복 제거)
└── Task 3: Canvas 임베드 transformer 개발

Wave 2 (이미지 기능 - Wave 1 완료 후):
├── Task 4: ImageLightbox 컴포넌트 개발
├── Task 5: 이미지 클릭 핸들러 통합
└── Task 6: Canvas 임베드 스크립트 개선

Wave 3 (검색/추천 - Wave 2 완료 후):
├── Task 7: Search 개선 (Fuse.js 튜닝)
├── Task 8: RelatedPosts 컴포넌트 개발
└── Task 9: TagFilter 개선

Wave 4 (최종 - Wave 3 완료 후):
├── Task 10: 통합 테스트 및 문서화
├── Task 11: Layout 통합 (quartz.layout.ts)
└── Task 12: 최종 검증 및 빌드 테스트
```

### 의존성 매트릭스

| 작업 | 의존   | 차단 | 병렬 가능 |
| ---- | ------ | ---- | --------- |
| 0    | 없음   | 1-3  | 없음      |
| 1    | 0      | 없음 | 2, 3      |
| 2    | 0      | 3    | 1         |
| 3    | 0, 2   | 없음 | 1         |
| 4    | 1-3    | 없음 | 5, 6      |
| 5    | 1-3, 4 | 없음 | 6         |
| 6    | 1-3    | 없음 | 4, 5      |
| 7    | 4-6    | 없음 | 8, 9      |
| 8    | 4-6    | 없음 | 7, 9      |
| 9    | 4-6    | 없음 | 7, 8      |
| 10   | 1-9    | 없음 | 없음      |
| 11   | 1-9    | 없음 | 없음      |
| 12   | 10-11  | 없음 | 없음      |

---

## TODO 작업 목록

### Wave 0: 사전 작업 (LSP 오류 수정)

- [ ] **0. 기존 LSP 오류 10개 수정**

  **할 일**:
  - [ ] `CanvasPage.tsx`: 사용되지 않는 `classNames` import 제거, 타입 에러 수정
  - [ ] `canvasPage.tsx`: 사용되지 않는 `path` import 제거, `links` 타입 에러 수정
  - [ ] `canvas.ts`: 사용되지 않는 import 제거, `externalResources` 반환 타입 수정
  - [ ] `canvasTransclude.inline.ts`: 사용되지 않는 `foundSlug` 변수 제거
  - [ ] `quartz.layout.ts`: `afterBody` 타입 에러 확인 (cfg.ts와 비교)

  **LSP 오류 상세**:

  ```
  CanvasPage.tsx:
  - 'classNames' is declared but its value is never read
  - Property 'configuration' does not exist on type 'GlobalConfiguration'

  canvasPage.tsx:
  - 'path' is declared but its value is never read
  - Type 'string[]' is not assignable to type 'SimpleSlug[]'
  - 'tree' is declared but its value is never read

  canvas.ts:
  - 'Root', 'VFile', 'path' declared but never read
  - externalResources return type incompatible

  canvasTransclude.inline.ts:
  - 'foundSlug' is declared but its value is never read

  quartz.layout.ts:
  - 'afterBody' does not exist in type 'PageLayout'
  ```

  **수락 기준**:
  - [ ] `npm run check` → 타입 에러 0개
  - [ ] 기존 기능 정상 작동 확인

  **커밋**: 예
  - 메시지: `fix: resolve existing LSP errors in canvas components`
  - 파일: 수정된 모든 파일
  - 사전커밋: `npm run check`

### Wave 1: 기반 개선

- [ ] **1. RecentNotes 검증 및 개선**

  **할 일**:
  - [ ] RecentNotes가 날짜 순으로 정렬되는지 테스트 작성
  - [ ] limit, showTags, filter 옵션 검증
  - [ ] quartz.layout.ts 설정 문서화

  **하지 말 것**:
  - 기존 기능 변경 (스타일, 동작)
  - 새로운 정렬 알고리즘 추가

  **권장 에이전트**:
  - **카테고리**: `quick`
  - **스킬**: 없음 (테스트 작성 중심)

  **병렬화**: 예 (작업 2, 3과 동시)

  **참고**:
  - `quartz/components/RecentNotes.tsx:28-93` - 컴포넌트 구현
  - `quartz.layout.ts:36-43` - 현재 설정
  - `quartz/util/path.ts` - 날짜 관련 유틸리티

  **수락 기준**:
  - [ ] 테스트: `npx tsx --test quartz/components/RecentNotes.test.ts` → PASS
  - [ ] 빌드: `npm run quartz build` → 성공
  - [ ] 검증: `grep -c 'recent-li' public/index.html` → 5개 (설정된 limit)

  **커밋**: 예
  - 메시지: `test(components): verify RecentNotes sorting and options`
  - 파일: `quartz/components/RecentNotes.test.ts`
  - 사전커밋: `npm run check`

- [ ] **2. Canvas 타입 리팩토링**

  **할 일**:
  - [ ] 공통 Canvas 타입 정의 파일 생성 (`quartz/types/canvas.ts`)
  - [ ] `canvasPage.tsx`, `canvas.ts`, `canvasTransclude.inline.ts`에서 중복 제거
  - [ ] import 경로 업데이트

  **하지 말 것**:
  - 타입 정의 변경 (이름, 필드 수정)
  - 런타임 동작 변경

  **권장 에이전트**:
  - **카테고리**: `quick`
  - **스킬**: 없음 (단순 리팩토링)

  **병렬화**: 예 (작업 1과 동시)

  **참고**:
  - `quartz/plugins/emitters/canvasPage.tsx:18-43` - 타입 정의 1
  - `quartz/plugins/transformers/canvas.ts:9-34` - 타입 정의 2
  - `quartz/components/scripts/canvasTransclude.inline.ts` - 타입 정의 3

  **수락 기준**:
  - [ ] `npm run check` → 타입 에러 없음
  - [ ] `grep -r "interface CanvasNode" quartz/` → 1개 파일만 (types/canvas.ts)
  - [ ] 기존 빌드 테스트 통과

  **커밋**: 예
  - 메시지: `refactor(canvas): extract common types to shared location`
  - 파일: `quartz/types/canvas.ts` + 변경된 파일들

- [ ] **3. Canvas 임베드 Transformer 개발**

  **할 일**:
  - [ ] Obsidian `![[file.canvas]]` 구문 파싱 transformer 작성
  - [ ] HTML `div.transclude[data-url]` 생성
  - [ ] canvas-index.json 연동

  **하지 말 것**:
  - Canvas 파일 자체 파싱 (이미 canvasPage.tsx에서 처리)
  - 중첩 Canvas 임베드 (한 단계만 지원)

  **권장 에이전트**:
  - **카테고리**: `ultrabrain`
  - **스킬**: 없음 (복잡한 transformer 로직)

  **병렬화**: 예 (작업 1, 2와 동시)
  - 단, 작업 2의 타입 리팩토링 완료 후 병합 필요

  **참고**:
  - `quartz/plugins/transformers/canvas.ts` - 기본 transformer (비어있음)
  - `quartz/plugins/transformers/ofm.ts` - Obsidian 문법 처리 예시
  - `quartz/components/scripts/canvasTransclude.inline.ts` - 클라이언트 렌더링

  **수락 기준**:
  - [ ] 테스트: `npx tsx --test quartz/plugins/transformers/canvas.test.ts` → PASS
  - [ ] 빌드: content/test-embed.md 생성 → `![[test.canvas]]` 포함 → 빌드 성공
  - [ ] 검증: `grep 'data-url="test.canvas"' public/test-embed.html` → 일치
  - [ ] Playwright: 임베드된 Canvas 렌더링 확인

  **커밋**: 예
  - 메시지: `feat(transformers): add canvas embed transformer`
  - 파일: `quartz/plugins/transformers/canvas.ts`

### Wave 2: 이미지 기능

- [ ] **4. ImageLightbox 컴포넌트 개발**

  **할 일**:
  - [ ] `quartz/components/ImageLightbox.tsx` 생성
  - [ ] 라이트박스 UI (오버레이, 닫기 버튼)
  - [ ] 키보드 네비게이션 (ESC 닫기, 화살표)
  - [ ] 스타일링 (SCSS)

  **하지 말 것**:
  - 별도 갤러리 페이지 생성
  - 이미지 업로드 기능
  - 이미지 편집/캡션 기능

  **권장 에이전트**:
  - **카테고리**: `visual-engineering`
  - **스킬**: `frontend-ui-ux`

  **병렬화**: 예 (작업 5, 6과 동시)

  **참고**:
  - `quartz/components/styles/` - SCSS 패턴
  - `quartz/components/Search.tsx` - 오버레이 UI 예시
  - 기존 이미지 렌더링: 마크다운 `![alt](path)`

  **수락 기준**:
  - [ ] Playwright 테스트:
    ```typescript
    await page.click('img[src*="test.jpg"]')
    await expect(page.locator(".lightbox")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.locator(".lightbox")).not.toBeVisible()
    ```

  **커밋**: 예
  - 메시지: `feat(components): add ImageLightbox component`
  - 파일: `quartz/components/ImageLightbox.tsx`, `quartz/components/styles/lightbox.scss`

- [ ] **5. 이미지 클릭 핸들러 통합**

  **할 일**:
  - [ ] 모든 마크다운 이미지에 클릭 이벤트 추가
  - [ ] Lightbox 컴포넌트와 연동
  - [ ] 이미지 로딩/에러 상태 처리

  **하지 말 것**:
  - 외부 URL 이미지 특별 처리
  - 이미지 확대/축소 기능 (간단하게)

  **권장 에이전트**:
  - **카테고리**: `visual-engineering`
  - **스킬**: `frontend-ui-ux`

  **병렬화**: 예 (작업 4 완료 후, 작업 6과 동시)

  **참고**:
  - `quartz/components/Content.tsx` - 본문 렌더링
  - `quartz/components/scripts/` - 인라인 스크립트 패턴

  **수락 기준**:
  - [ ] Playwright: 모든 페이지의 이미지 클릭 가능
  - [ ] 깨진 이미지: 에러 상태 표시, 크래시 없음

  **커밋**: 예 (작업 4와 그룹화 가능)
  - 메시지: `feat(components): integrate lightbox with markdown images`

- [ ] **6. Canvas 임베드 스크립트 개선**

  **할 일**:
  - [ ] `canvasTransclude.inline.ts` 개선
  - [ ] panzoom 통합
  - [ ] 반응형 디자인

  **하지 말 것**:
  - Canvas 편집 기능 (드래그앤드롭)
  - 실시간 동기화

  **권장 에이전트**:
  - **카테고리**: `visual-engineering`
  - **스킬**: 없음

  **병렬화**: 예 (작업 4, 5와 동시)

  **참고**:
  - `quartz/components/scripts/canvasTransclude.inline.ts`
  - 이미 `panzoom` 라이브러리 로드됨

  **수락 기준**:
  - [ ] Playwright: 임베드된 Canvas 줌/패닝 작동

  **커밋**: 예
  - 메시지: `feat(scripts): improve canvas transclude interaction`

### Wave 3: 검색 및 추천

- [ ] **7. Search 개선 (Fuse.js 튜닝)**

  **할 일**:
  - [ ] Fuse.js 옵션 최적화 (threshold, distance)
  - [ ] 검색 결과 하이라이팅
  - [ ] 키보드 단축키 (Cmd+K / Ctrl+K)

  **하지 말 것**:
  - 검색 알고리즘 완전 교체
  - 검색 분석/추적 추가

  **권장 에이전트**:
  - **카테고리**: `unspecified-low`
  - **스킬**: 없음

  **병렬화**: 예 (작업 8, 9와 동시)

  **참고**:
  - `quartz/components/Search.tsx`
  - Fuse.js 문서: https://fusejs.io/api/options.html

  **수락 기준**:
  - [ ] 검색 결과가 500ms 내에 표시
  - [ ] 키보드 네비게이션 작동
  - [ ] 한국어/영문 검색 정상 작동

  **커밋**: 예
  - 메시지: `feat(search): improve Fuse.js configuration and keyboard nav`

- [ ] **8. RelatedPosts 컴포넌트 개발**

  **할 일**:
  - [ ] `quartz/components/RelatedPosts.tsx` 생성
  - [ ] 태그 기반 매칭 알고리즘
  - [ ] 설정 가능한 개수 (기본 3-5개)
  - [ ] 자기 자신 제외 로직

  **하지 말 것**:
  - ML 기반 추천
  - 복잡한 가중치 알고리즘

  **권장 에이전트**:
  - **카테고리**: `unspecified-low`
  - **스킬**: 없음

  **병렬화**: 예 (작업 7, 9와 동시)

  **참고**:
  - `quartz/components/RecentNotes.tsx` - 유사한 패턴
  - `quartz/plugins/vfile.ts` - QuartzPluginData 타입

  **수락 기준**:
  - [ ] 테스트: 공유 태그 기반 매칭 검증
  - [ ] 자기 자신 제외 확인
  - [ ] 설정된 개수만큼만 표시

  **커밋**: 예
  - 메시지: `feat(components): add RelatedPosts component`
  - 파일: `quartz/components/RelatedPosts.tsx`

- [ ] **9. TagFilter 개선**

  **할 일**:
  - [ ] 태그 페이지 UI 개선 (`quartz/plugins/emitters/tagPage.tsx`)
  - [ ] 태그 클라우드/목록 컴포넌트
  - [ ] 현재 페이지의 태그 하이라이팅

  **하지 말 것**:
  - 중첩 카테고리 시스템
  - 태그 관리 UI

  **권장 에이전트**:
  - **카테고리**: `visual-engineering`
  - **스킬**: `frontend-ui-ux`

  **병렬화**: 예 (작업 7, 8와 동시)

  **참고**:
  - `quartz/plugins/emitters/tagPage.tsx`
  - `quartz/components/TagList.tsx`

  **수락 기준**:
  - [ ] 태그 페이지에서 해당 태그의 게시물만 표시
  - [ ] 태그 목록 UI 개선

  **커밋**: 예
  - 메시지: `feat(emitters): improve tag page UI and filtering`

### Wave 4: 통합 및 검증

- [ ] **10. 통합 테스트 및 문서화**

  **할 일**:
  - [ ] Playwright E2E 테스트 작성
  - [ ] README/문서 업데이트
  - [ ] 설정 예시 추가

  **권장 에이전트**:
  - **카테고리**: `unspecified-low`
  - **스킬**: `playwright`

  **병렬화**: 아니요 (순차)

  **수락 기준**:
  - [ ] `npx playwright test` → 모든 테스트 통과
  - [ ] 문서에 설정 방법 명시

  **커밋**: 예
  - 메시지: `test(e2e): add integration tests and documentation`

- [ ] **11. Layout 통합 (quartz.layout.ts)**

  **할 일**:
  - [ ] ImageLightbox를 공통 컴포넌트로 추가
  - [ ] RelatedPosts를 ContentPage에 추가
  - [ ] TagFilter를 ListPage에 추가
  - [ ] 새로운 설정 옵션 문서화

  **권장 에이전트**:
  - **카테고리**: `quick`
  - **스킬**: 없음

  **병렬화**: 아니요 (순차)

  **수락 기준**:
  - [ ] `quartz.layout.ts` 업데이트
  - [ ] `npm run check` 통과
  - [ ] 빌드 성공

  **커밋**: 예
  - 메시지: `feat(layout): integrate new components into page layouts`
  - 파일: `quartz.layout.ts`

- [ ] **12. 최종 검증 및 빌드 테스트**

  **할 일**:
  - [ ] 전체 빌드 테스트
  - [ ] 성능 검증 (이미지 수, Canvas 크기)
  - [ ] 모든 기능 최종 확인

  **권장 에이전트**:
  - **카테고리**: `unspecified-low`
  - **스킬**: 없음

  **병렬화**: 아니요 (순차)

  **수락 기준**:
  - [ ] `npm run check` → 성공
  - [ ] `npm run quartz build` → 성공
  - [ ] `npm run test` → 성공
  - [ ] 수동 확인: 홈페이지, 게시물, 태그 페이지, Canvas 페이지

  **커밋**: 아니요 (최종 검증)

---

## 커밋 전략

| 작업 후 | 메시지                                            | 파일                                    | 검증                  |
| ------- | ------------------------------------------------- | --------------------------------------- | --------------------- |
| 1       | `test(components): verify RecentNotes sorting`    | `*.test.ts`                             | `npx tsx --test`      |
| 2       | `refactor(canvas): extract common types`          | `quartz/types/canvas.ts`                | `npm run check`       |
| 3       | `feat(transformers): add canvas embed`            | `quartz/plugins/transformers/canvas.ts` | 테스트 + 빌드         |
| 4       | `feat(components): add ImageLightbox`             | `ImageLightbox.tsx`                     | Playwright            |
| 5-6     | `feat(components): integrate lightbox and canvas` | `*.tsx`, `*.ts`                         | Playwright            |
| 7       | `feat(search): improve Fuse.js config`            | `Search.tsx`                            | 수동 테스트           |
| 8       | `feat(components): add RelatedPosts`              | `RelatedPosts.tsx`                      | 테스트                |
| 9       | `feat(emitters): improve tag page`                | `tagPage.tsx`                           | 빌드                  |
| 10      | `test(e2e): add integration tests`                | `*.spec.ts`                             | `npx playwright test` |
| 11      | `feat(layout): integrate components`              | `quartz.layout.ts`                      | 빌드                  |

---

## 성공 기준

### 검증 명령어

```bash
# 타입 체크
npm run check

# 빌드
npm run quartz build

# 테스트
npm run test
npx tsx --test quartz/components/*.test.ts
npx playwright test

# 특정 기능 검증
grep -q 'recent-notes' public/index.html && echo "RecentNotes OK"
grep -q 'canvas-page' public/*.html && echo "Canvas OK"
grep -q 'lightbox' public/*.html && echo "Lightbox OK"
grep -q 'related-posts' public/*.html && echo "RelatedPosts OK"
```

### 최종 체크리스트

- [ ] 모든 기능이 홈페이지에서 확인 가능
- [ ] Canvas 파일이 전체 화면과 임베드 둘 다 작동
- [ ] 이미지 클릭 시 라이트박스 열림
- [ ] 검색이 키보드로 네비게이션 가능
- [ ] 관련 게시물이 게시물 하단에 표시
- [ ] 태그 페이지가 필터링 정상 작동
- [ ] 모든 테스트 통과
- [ ] 빌드 성공
- [ ] `npm run check` 통과

---

## 메모

### 사용자 결정 완료 ✅

**모든 결정 사항이 승인되었습니다**:

1. **Canvas UI 언어**: 한국어 유지 ("확대", "축소", "초기화")
2. **이미지 라이트박스 디자인**:
   - 배경: 어둡게 (var(--dark) 90%) ✓
   - 네비게이션: 화살표 키 지원 ✓
   - 확대/축소: 미지원 (단순하게) ✓
3. **관련 게시물 알고리즘**:
   - 공유 태그 수 내림차순, 동점 시 날짜 ✓
   - 최대 5개 ✓
   - 자기 자신 제외 ✓

### 예상 일정

- **Wave 0** (LSP 오류 수정): 1일
- **Wave 1** (기반 개선): 1-2일
- **Wave 2** (이미지 기능): 2-3일
- **Wave 3** (검색/추천): 2-3일
- **Wave 4** (통합/검증): 1-2일

**총 예상**: 7-11일 (병렬 실행 시)

### 알려진 이슈

### 알려진 이슈

1. **CanvasNode 타입 중복**: 3개 파일에 동일한 인터페이스 정의 (작업 2에서 해결)
2. **Canvas 임베드 누락**: `![[file.canvas]]` 파싱 transformer 없음 (작업 3에서 해결)
3. **canvasTransclude 한국어**: CanvasPage.tsx와 일관성 유지 필요

### 참고 자료

- [Quartz 공식 문서](https://quartz.jzhao.xyz/)
- [Fuse.js 옵션](https://fusejs.io/api/options.html)
- [Obsidian Canvas 포맷](https://help.obsidian.md/Canvas)
- [Preact 컴포넌트 패턴](https://preactjs.com/guide/v10/components)
