# 랜딩 페이지 KO/EN 언어 토글 — 설계 문서

**작성일**: 2026-07-09
**범위**: 랜딩(index) 페이지에 한국어/영어 전환 토글 추가
**상태**: 승인 대기

## 1. 목표

랜딩 페이지 최상단(TopNav)의 다크모드 버튼 옆에 "밀어서 잠금해제" 느낌의 **슬라이드 스위치**를 두어, 랜딩 페이지의 모든 정보를 한국어 또는 영어로 전환해 보여준다.

- 적용 범위: **랜딩(index) 페이지만** (CV/Publications 등 하위 페이지는 이번 범위 밖)
- 인터랙션: **슬라이드 스위치** (`KO ●——` ⇄ `——● EN`), 클릭 시 애니메이션 전환
- 기본 언어: **영어** (저장된 선택이 없는 첫 방문자)
- 번역 데이터 스키마: **`{ en, ko }` 객체**
- 번역문: 개발 과정에서 영문을 바탕으로 한국어 초안 작성

## 2. 아키텍처 결정

### 선택: 이중 렌더 + CSS 전환 (다크모드 쌍둥이 패턴)

두 언어를 HTML에 모두 렌더링하고, `documentElement`의 `saved-lang` 속성 값에 따라 CSS로 한쪽만 표시한다. 언어 선택은 `localStorage`에 저장하고, 첫 페인트 전 인라인 스크립트로 속성을 설정해 깜빡임(FOUC)을 방지한다.

이 방식은 기존 `darkmode.inline.ts`(localStorage + `saved-theme` 속성 + `beforeDOMLoaded` 인라인 스크립트)와 **완전히 동일한 idiom**이라 코드 일관성과 무깜빡임을 동시에 얻는다.

### 기각한 대안

- **언어별 페이지 emit** (`index.html` + `ko/index.html`): SEO엔 유리하나 빌드 배관이 복잡하고 전환 시 새로고침이 필요. 랜딩 한 페이지 범위엔 과함.
- **JS 텍스트 교체**: 초기 렌더 깜빡임과 유지보수 부담. 이중 렌더 대비 이점 없음.

## 3. 구성 요소

### 3.1 `quartz/components/LangToggle.tsx` (신규)

- 다크모드 버튼 옆에 놓이는 슬라이드 스위치 컴포넌트.
- 마크업: `role="switch"` + `aria-checked` + `aria-label`. 노브(knob)와 좌우 `KO`/`EN` 라벨.
- `Darkmode.tsx`와 동일한 컴포넌트 규약: `LangToggle.beforeDOMLoaded = langToggleScript`, `LangToggle.css = styles`.

### 3.2 `quartz/components/scripts/langtoggle.inline.ts` (신규)

`darkmode.inline.ts`의 쌍둥이:

- 로드 시: `localStorage.getItem("lang") ?? "en"`으로 `document.documentElement.setAttribute("saved-lang", lang)`을 첫 페인트 전에 실행.
- `document.addEventListener("nav", ...)` 안에서 `.langtoggle` 요소에 클릭 리스너 등록(SPA 네비게이션 대응), `window.addCleanup`으로 해제.
- 클릭 시: `en`↔`ko` 토글 → 속성 갱신 → `localStorage.setItem("lang", …)` → `langchange` CustomEvent 발행 → 스위치 `aria-checked` 갱신.
- `CustomEventMap`에 `langchange` 타입 추가.

### 3.3 `quartz/components/styles/langtoggle.scss` (신규)

- 슬라이드 스위치 시각 스타일(트랙, 노브, KO/EN 라벨, 전환 애니메이션).
- **언어 표시 전환 규칙(전역)**:
  ```scss
  html[saved-lang="en"] .i18n-ko { display: none; }
  html[saved-lang="ko"] .i18n-en { display: none; }
  ```
- 기본값 안전장치: `saved-lang` 미설정 시 `.i18n-ko`를 숨겨 영어가 보이도록.

### 3.4 `<T>` 헬퍼 컴포넌트 (신규, 소형)

- 사용법: `<T en="Contact" ko="연락처" />`
- 렌더 결과: `<span class="i18n-en">Contact</span><span class="i18n-ko">연락처</span>`
- 인라인 요소이므로 `<span>` 사용. Portfolio·TopNav의 고정 UI 라벨에 사용.
- 배치: `quartz/components/` 하위의 작은 유틸(예: `LangText.tsx` 또는 `T.tsx`).

### 3.5 데이터 스키마 확장 (`quartz/util/portfolio.ts` + `data/*.yaml`)

- 번역 대상 필드 타입을 `Localized<string> = string | { en: string; ko: string }`로 확장.
- 순수 문자열이면 "양 언어 동일"로 취급(하위호환).
- `loadPortfolio`는 양쪽 값을 그대로 로드(변환 없음); 렌더 시 `<T>` 또는 헬퍼로 두 언어 span을 emit.
- 해석 헬퍼: `localizedPair(v: Localized<string>): { en: string; ko: string }` — 문자열이면 `{ en: v, ko: v }` 반환.

## 4. 데이터 흐름

```
data/*.yaml (en+ko)
  → loadPortfolio()            (양쪽 그대로 로드)
  → Portfolio.tsx / TopNav.tsx (<T>/헬퍼로 두 언어 span 렌더)
  → html[saved-lang] 속성 + CSS (활성 언어만 표시)
  ← LangToggle 클릭 → 속성/localStorage 갱신 + langchange 이벤트
```

## 5. 번역이 필요한 텍스트 (랜딩 범위)

### 5.1 `data/profile.yaml` (스키마 → `{ en, ko }`)
- `role`
- `bio`
- `about`
- `affiliation`의 `lab.name` / `pi.name` / `institution.name`(필요 시)
- `interests`(칩 라벨 — 번역 여부는 구현 시 판단, 고유명사/약어는 영어 유지 가능)
- `name`, `contacts.label`(이메일/GitHub 등 고유값)은 번역 불필요 → 문자열 유지

### 5.2 `data/news.yaml`
- 각 항목 `html` → `{ en, ko }`

### 5.3 `Portfolio.tsx` 고정 라벨 (코드 내 `<T>`)
- Contact / Research Interests / News / Selected Publications
- All publications → / Explore
- Explore 카드 5개의 제목·설명 (📄 Publications, 🎤 Talks, 🏆 Awards, 📚 Paper Dashboard, 🧠 Knowledge Wiki)
- 빈 상태 문구("Publications will appear here soon.")

### 5.4 `TopNav.tsx` 링크 라벨 (코드 내 `<T>`)
- CV / Publications / Projects / Talks / Awards / Wiki / Papers / Concepts
- (TopNav는 공용 컴포넌트지만 랜딩에도 노출되므로 이번 범위에 포함. 하위 페이지에서도 자연히 이중 렌더되지만 토글 자체는 랜딩에만 배치)

### 5.5 `projects.yaml` 초록
- 이미 `abstractKo`/`abstractEn` 존재 → 랜딩 카드 초록이 활성 언어에 맞춰 표시되도록 정렬(가능하면 `i18n-en/ko` 래핑으로 통일).

## 6. 엣지 케이스 / 주의점

- **깜빡임 방지**: `saved-lang`은 반드시 `beforeDOMLoaded` 인라인 스크립트로 첫 페인트 전 설정.
- **SPA 네비게이션**: Quartz의 `nav` 이벤트 안에서 리스너 등록/정리(다크모드와 동일).
- **접근성**: 스위치 `role="switch"`, `aria-checked`, 키보드(Enter/Space) 조작, 포커스 링.
- **SEO**: 이중 렌더라 두 언어가 모두 DOM에 존재 → 숨김 텍스트가 크롤러에 노출. 랜딩 한 페이지라 영향은 제한적(기록용 주의사항).
- **토글 배치**: `LangToggle`은 TopNav의 `DarkmodeInner` **바로 앞/옆**에 삽입. TopNav의 `css`/`beforeDOMLoaded`/`afterDOMLoaded` 합성에 `LangToggle`의 리소스도 함께 등록.
- **하위 페이지 일관성**: 토글은 랜딩에만 두지만, `<T>`로 감싼 TopNav 링크는 모든 페이지에서 이중 렌더된다. `saved-lang`이 항상 설정되므로 다른 페이지에서도 저장된 언어가 반영됨(문제 없음, 오히려 일관적).

## 7. 테스트

- `localizedPair`/`Localized` 헬퍼 단위 테스트(`node:test`): 문자열 입력 → `{en,ko}` 동일값, 객체 입력 → 그대로.
- 빌드 스모크: `npx quartz build` 후 `public/index.html`에 `i18n-en`/`i18n-ko` span과 `langtoggle` 요소가 존재하는지 확인.
- 수동 확인: 토글 클릭 → 텍스트 전환, 새로고침 후 선택 유지, 새 방문자 영어 기본, 다크모드와 독립 동작.

## 8. 범위 밖 (YAGNI)

- 하위 페이지(CV/Publications 등) 본문 번역.
- 3개 이상 언어 확장.
- URL 기반 언어 라우팅(`/ko/`).
- 자동 기계번역 파이프라인.
