# SuccessFactors Job History Viewer (project1)

SuccessFactors의 사용자 정보 및 직무 이력(Job History)을 조회하는 SAP Fiori 애플리케이션입니다.

## 🚀 주요 기능

### 1. 사용자 프로필 및 사진 조회
- `User` 엔티티와 `Photo` 엔티티를 연동하여 사용자의 기본 정보와 프로필 이미지를 실시간으로 표시합니다.

### 2. 개선된 직무 이력 테이블 (Job Information)
- **데이터 확장(Expand):** `EmpJob` 엔티티 조회 시 `eventNav`, `eventReasonNav`, `companyNav` 등 연관된 Navigation Property를 함께 로드하여 상세 명칭을 표시합니다.
- **다국어 지원(Locale-aware):** SuccessFactors의 `picklistLabels`를 분석하여 사용자의 브라우저 언어 설정에 맞는 이벤트 명칭을 동적으로 출력합니다.
- **표준 형식 적용:** 모든 주요 항목은 `명칭 (코드)` 형식(예: 데이터 변경 (3666))으로 표시되어 가독성과 데이터 정확성을 동시에 제공합니다.

### 3. 직무 상세 정보 다이얼로그
- 테이블 행 클릭 시 `JobDetailDialog` 프래그먼트를 통해 조직 정보(부서, 부문, 위치 등)와 직무 상세 내용을 한눈에 확인할 수 있습니다.

## 🛠 기술 세부 사항

### 데이터 프로세스 (View1.controller.js)
1. **병렬 데이터 로드:** `Promise.all`을 사용하여 사용자 정보, 사진, 직무 이력을 동시에 비동기로 호출함으로써 초기 로딩 속도를 최적화했습니다.
2. **정렬 로직:** `startDate`를 기준으로 최신 이력이 상단에 오도록 클라이언트 측 정렬을 수행합니다.
3. **Batch 모드 제어:** 데이터의 정확한 조회를 위해 필요에 따라 `setUseBatch(false)` 설정을 적용했습니다.

### 포매팅 로직 (formatter.js)
- `getPicklistLabel`: SuccessFactors OData의 복잡한 픽리스트 구조(`results` 배열)에서 현재 `locale`에 매칭되는 라벨을 찾아주는 핵심 로직입니다. 일치하는 언어가 없을 경우 `en_US`를 기본값으로 사용합니다.

## 📦 프로젝트 구조

- **webapp/controller/View1.controller.js**: 메인 비즈니스 로직 및 데이터 바인딩 제어
- **webapp/model/formatter.js**: 다국어 처리 및 텍스트 포맷팅 함수
- **webapp/view/View1.view.xml**: 직무 이력 테이블이 포함된 메인 화면
- **webapp/view/JobDetailDialog.fragment.xml**: 상세 정보 표시를 위한 재사용 가능한 다이얼로그

## 🏃 실행 방법

### 사전 요구 사항
- NodeJS LTS 버전 설치

### 애플리케이션 시작
```bash
npm start
```

### Mock 데이터로 실행
```bash
npm run start-mock
```

---

## 📝 개발 노트

| 항목 | 내용 |
| :--- | :--- |
| **UI5 버전** | 1.144.0 |
| **테마** | sap_horizon |
| **서비스 타입** | OData V2 (SuccessFactors) |
| **주요 엔티티** | User, Photo, EmpJob, FOEventReason |

*이 문서는 Gemini Code Assist를 통해 분석 및 작성되었습니다.*
