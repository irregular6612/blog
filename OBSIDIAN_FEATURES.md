# Obsidian Canvas & Database(Base) 지원

이 Quartz 블로그는 Obsidian의 Canvas와 Database(Base) 파일을 인터랙티브하게 지원합니다.

## 🎨 Canvas 지원

### 기능

- **인터랙티브 뷰어**: 줌, 패닝 기능이 있는 Canvas 뷰어
- **노드 렌더링**: 파일, 텍스트, 이미지 노드 지원
- **링크 연결**: Canvas에 포함된 파일들이 그래프 뷰에 표시됨
- **화살표 연결**: 노드 간의 화살표 연결 표시

### 사용 방법

1. Obsidian에서 `.canvas` 파일 생성
2. `content` 폴더에 Canvas 파일 복사
3. 빌드하면 자동으로 렌더링됨

### Canvas 파일 구조

```json
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "file",
      "file": "path/to/file.md",
      "x": 0,
      "y": 0,
      "width": 400,
      "height": 400
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "fromNode": "node-id-1",
      "fromSide": "right",
      "toNode": "node-id-2",
      "toSide": "left"
    }
  ]
}
```

### 컨트롤

- **+**: 확대
- **−**: 축소
- **⟲**: 뷰 초기화
- **드래그**: 화면 이동
- **노드 클릭**: 해당 페이지로 이동

---

## 📊 Database (Base) 지원

### 기능

- **인터랙티브 테이블**: 정렬, 필터링 가능한 데이터베이스 뷰
- **다양한 컬럼 타입**:
  - 텍스트, 숫자, 날짜
  - 체크박스, 선택, 다중 선택
  - 파일 링크, URL
- **실시간 검색**: 테이블 내용 실시간 검색
- **컬럼 필터링**: 특정 컬럼만 검색
- **그래프 연동**: 데이터베이스의 파일 링크가 그래프에 표시됨

### 사용 방법

1. `.base` 파일 생성 (JSON 형식)
2. `content` 폴더에 파일 복사
3. 빌드하면 자동으로 테이블로 렌더링됨

### Base 파일 구조

```json
{
  "name": "데이터베이스 이름",
  "columns": [
    {
      "id": "column-id",
      "name": "컬럼명",
      "type": "text|number|date|checkbox|select|multi-select|file|url",
      "options": ["선택1", "선택2"]
    }
  ],
  "rows": [
    {
      "id": "row-id",
      "values": {
        "column-id": "값"
      }
    }
  ]
}
```

### 지원하는 컬럼 타입

#### 1. text (텍스트)

```json
{
  "id": "title",
  "name": "제목",
  "type": "text"
}
```

#### 2. number (숫자)

```json
{
  "id": "priority",
  "name": "우선순위",
  "type": "number"
}
```

#### 3. date (날짜)

```json
{
  "id": "deadline",
  "name": "마감일",
  "type": "date"
}
```

#### 4. checkbox (체크박스)

```json
{
  "id": "completed",
  "name": "완료 여부",
  "type": "checkbox"
}
```

#### 5. select (단일 선택)

```json
{
  "id": "status",
  "name": "상태",
  "type": "select",
  "options": ["진행중", "완료", "대기"]
}
```

#### 6. multi-select (다중 선택)

```json
{
  "id": "tags",
  "name": "태그",
  "type": "multi-select"
}
```

#### 7. file (파일 링크)

```json
{
  "id": "link",
  "name": "관련 문서",
  "type": "file"
}
```

- 값: `"content/path/to/file.md"` 또는 배열 `["file1.md", "file2.md"]`
- 자동으로 내부 링크로 변환됨
- 그래프 뷰에 표시됨

#### 8. url (외부 링크)

```json
{
  "id": "reference",
  "name": "참고 링크",
  "type": "url"
}
```

- 값: `"https://example.com"`
- 새 탭에서 열림

---

## 예제

### 예제 1: 프로젝트 관리 데이터베이스

파일: `content/projects.base`

```json
{
  "name": "프로젝트 관리",
  "columns": [
    { "id": "name", "name": "프로젝트명", "type": "text" },
    { "id": "status", "name": "상태", "type": "select", "options": ["진행중", "완료", "보류"] },
    { "id": "priority", "name": "우선순위", "type": "number" },
    { "id": "tags", "name": "태그", "type": "multi-select" },
    { "id": "docs", "name": "문서", "type": "file" },
    { "id": "deadline", "name": "마감일", "type": "date" },
    { "id": "completed", "name": "완료", "type": "checkbox" }
  ],
  "rows": [
    {
      "id": "proj1",
      "values": {
        "name": "블로그 개선",
        "status": "진행중",
        "priority": 1,
        "tags": ["개발", "디자인"],
        "docs": "content/projects/blog.md",
        "deadline": "2025-11-01",
        "completed": false
      }
    }
  ]
}
```

웹에서 확인: `https://your-blog.com/projects`

### 예제 2: 학습 노트 Canvas

파일: `content/learning/deep-learning.canvas`

```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "file",
      "file": "content/notes/neural-networks.md",
      "x": 0,
      "y": 0,
      "width": 400,
      "height": 300
    },
    {
      "id": "node2",
      "type": "text",
      "text": "딥러닝의 핵심 개념",
      "x": 500,
      "y": 0,
      "width": 300,
      "height": 200
    }
  ],
  "edges": [
    {
      "id": "edge1",
      "fromNode": "node1",
      "fromSide": "right",
      "toNode": "node2",
      "toSide": "left"
    }
  ]
}
```

웹에서 확인: `https://your-blog.com/learning/deep-learning`

---

## 설정

### quartz.config.ts

```typescript
plugins: {
  transformers: [
    // ... 다른 플러그인들
    Plugin.Canvas(),
    Plugin.Bases(),
  ],
  emitters: [
    // ... 다른 플러그인들
    Plugin.CanvasPage(),
    Plugin.BasesPage(),
  ],
}
```

이미 설정되어 있으므로 별도 설정 불필요합니다.

---

## 주의사항

1. **파일 경로**: Canvas와 Base의 파일 링크는 `content` 폴더 기준 상대 경로를 사용하세요.
2. **한글 지원**: 파일명과 경로에 한글이 포함되어도 정상 작동합니다.
3. **그래프 뷰**: Canvas와 Base의 파일 링크는 자동으로 그래프 뷰에 표시됩니다.
4. **JSON 형식**: `.base` 파일은 유효한 JSON 형식이어야 합니다.

---

## 문제 해결

### Canvas가 표시되지 않는 경우

1. `.canvas` 확장자가 올바른지 확인
2. JSON 형식이 유효한지 확인
3. 브라우저 콘솔에서 에러 확인

### Base 테이블이 표시되지 않는 경우

1. `.base` 확장자가 올바른지 확인
2. JSON 형식이 유효한지 확인 (특히 컬럼과 행의 ID 매칭)
3. 브라우저 콘솔에서 에러 확인

### 링크가 작동하지 않는 경우

1. 파일 경로가 `content` 폴더 기준인지 확인
2. `.md` 확장자가 포함되었는지 확인
3. 대소문자가 정확한지 확인

---

## 기술 스택

- **Canvas 렌더링**: SVG + Panzoom.js
- **Bases 렌더링**: HTML Table + JavaScript
- **스타일링**: CSS Variables (다크모드 지원)
- **플러그인**: Quartz Transformer & Emitter Plugins
