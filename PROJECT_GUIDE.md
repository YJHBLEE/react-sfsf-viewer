# Project Strategy: React SuccessFactors Viewer

이 문서는 프로젝트의 구조, 기술 스택, 데이터 흐름 및 향후 개발 방향을 정의하여 일관성 있는 개발 환경을 유지하기 위해 작성되었습니다.

---

## 1. 개요 및 기술 스택 (Tech Stack)

이 프로젝트는 **SAP BTP (Business Technology Platform)** 환경에서 구동되는 **React 기반의 인사 정보 시각화 애플리케이션**입니다.

- **Core**: React 18 (Vite 사용)
- **Styling**: TailwindCSS (Utility-first CSS)
- **Icons**: Lucide-react
- **Data Fetching**: Axios
- **Deployment**: SAP BTP MTA (Multitarget Application)
- **Platform Services**: SAP Destination Service, XSUAA (보안 및 인증)

---

## 2. 프로젝트 구조 분석 (Directory Structure)

```text
/Users/bebooja/Dev/btpreact/
├── mta.yaml             # BTP 리소스 및 빌드 설정 (Core)
├── package.json         # 프로젝트 의존성 및 스크립트
├── vite.config.js       # Vite 빌드 설정
├── tailwind.config.js   # Tailwind 프리셋 설정
├── public/
│   ├── xs-app.json      # BTP AppRouter 라우팅/보안 설정 (프록시 규칙)
│   └── manifest.json    # 앱 메타데이터
└── src/
    ├── main.jsx         # 진입점
    ├── App.jsx          # 메인 비즈니스 로직 및 UI (현재 단일 파일 구조)
    ├── Component.js     # SAP UI5 브리지용 설정 (선택 사항)
    └── index.css        # 글로벌 스타일
```

---

## 3. 핵심 아키텍처 및 데이터 흐름

### A. API 프록시 (xs-app.json)
SuccessFactors API 호출 시 CORS 문제를 피하기 위해 BTP Destination을 통해 라우팅됩니다.
- `/SuccessFactors_API/` → SuccessFactors OData API 연결
- `/user-api/` → 현재 접속 유저 정보 조회

### B. 주요 엔티티 (SuccessFactors OData v2)
- `User`: 기본 프로필 정보 (이름, 타이틀, 부서 등)
- `Photo`: 사용자 사진 자료 (photoType=1)
- `EmpJob`: 인사 발령 및 이력 정보 (`eventNav`, `companyNav`, `departmentNav` 확장 사용)

---

## 4. 향후 작업 가이드라인 (Roadmap)

### 완료된 주요 기반 작업 (Completed)
- **다국어(i18n) 프레임워크**: 한국어, 영어, 일본어 번역 체계 구축 및 실시간 전환 기능(헤더 통합) 구현.
- **아키텍처 리팩토링**: 서비스 레이어(sfService), 커스텀 훅(useSFData), 전역 컨텍스트(AppContext) 분리 완료.
- **UI 컴포넌트화**: Header, Sidebar, ProfileHeader 등 주요 UI의 독립 컴포넌트화 완료.

### 향후 개발 계획 (Backlog)
- **통합 검색 기능 (Global Search)**: 사람 검색, 메뉴 검색, 평가서 검색 등을 아우르는 헤더 검색 로직 구현.
- **개인화 설정 화면 (Preferences)**: SuccessFactors Custom MDF와 연동하여 테마, 알림 설정, 국가/회사별 정책 반영.
- **평가 모듈 (Performance Management)**: 표준 SF 기능을 확장한 고도화된 평가 프로세스 구현 (최우선 순위).

---

## 5. SuccessFactors 평가서 커스터마이징 전략

비즈니스 요구사항에 맞춰 SF 표준 기능을 확장합니다.

### A. 평가 설정 및 매핑 (Custom MDF 활용)
- **카테고리 & 기간 관리**: SF 템플릿 ID를 비즈니스 카테고리(성과, 임원, 동료, 수습 등) 및 기간(상/하반기 등)과 연결.
- **Variant 관리**: 회사, 직군(Employee Class), 국가별로 상이한 템플릿 매핑 정보를 Custom MDF에서 관리.
- **360 참조 설정**: PM Form 작성 시 참조할 360 Form 템플릿 연결 정보 정의.

### B. 평가 Inbox & To-do
- **필터링**: 정의된 카테고리/기간별 평가서 조회 UI 구현.
- **To-do 리스트**: 사용자 잉박스(Inbox)에 있는 처리 필요 평가서를 우선 노출하여 업무 효율 증대.

### C. UI/UX 고도화 및 데이터 합산
- **사용자 친화적 디자인**: SF 표준 화면보다 선명하고 직관적인 Route Map, Goals, Competencies 화면 구성.
- **평가 점수 합산 (Aggregation)**: 상/하반기 합산 점수 생성 등 표준 기능 외 로직을 Custom MDF를 통해 구현 및 평가서 반영. (API: `odata/v2/upsert` 등 활용)

---

## 6. 개발 원칙 (Rules)

1. **다국어 적용 필수**: 모든 신규 UI 요소 및 메시지는 반드시 `i18n` 번역 키를 정의하여 사용함.
2. **BTP 배포 최적화**: SAP BTP HTML5 Application Repository 환경에 최적화된 빌드 및 라우팅 구조를 준수함.
3. **Vercel 호환성**: 문자열 내 어퍼스트로피(`'`)는 `&apos;`, 큰따옴표(`"`)는 `&quot;`로 치환하여 작성.
4. **모바일 우선**: 모든 UI 구성 요소는 Mobile-Responsive하게 설계.
5. **전문적 문체**: 가독성이 높고 명확한 비즈니스 전문 용어를 사용하여 전문적인 어조를 유지함.

---
*Last Updated: 2026-02-13*
