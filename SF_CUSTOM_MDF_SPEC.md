# SuccessFactors Custom MDF Specification

이 문서는 SuccessFactors 표준 기능을 보완하고 비즈니스 요구사항(평가 카테고리화, 기간 매핑, 점수 합산)을 충족하기 위해 정의된 Custom MDF 오브젝트의 설계 명세입니다.

---

## 1. 평가 마스터 매핑 (`cust_PMPeriodMapping`)

SuccessFactors의 개별 템플릿(Template ID)을 비즈니스 관점의 카테고리 및 기간과 연결합니다.

| 필드 ID | 명칭 | 데이터 타입 | 설명 |
| :--- | :--- | :--- | :--- |
| `externalCode` | 매핑 코드 | String | 고유 식별자 (예: MAP_2024_H1_ST) |
| `cust_category` | 평가 카테고리 | Enum | 성과평가, 임원평가, 동료평가, 수습평가 등 |
| `cust_period` | 평가 기간 | String | 2024년 상반기, 2024년, 2026년 하반기 등 |
| `cust_templateId` | PM 템플릿 ID | Number | SuccessFactors의 물리적 PM Template ID |
| `cust_360TemplateId` | 연동 360 ID | Number | 참조할 360 평가 템플릿 ID (선택 사항) |
| `cust_variant` | 배리언트 | String | 회사(Legal Entity), 직군(Employee Class), 국가용 구분자 |
| `cust_isActive` | 활성 여부 | Boolean | 해당 설정의 사용 여부 |

---

## 2. 평가 결과 합산 관리 (`cust_PMSummaryScores`)

표준 기능에서 지원하지 않는 상/하반기 점수 합산 및 가중치 계산 결과를 저장합니다.

| 필드 ID | 명칭 | 데이터 타입 | 설명 |
| :--- | :--- | :--- | :--- |
| `externalCode` | 합산 코드 | String | 유저ID + 평가연도 (예: 10045_2024) |
| `cust_userId` | 대상 사용자 | String | SuccessFactors User ID |
| `cust_year` | 평가 연도 | String | 예: 2024 |
| `cust_h1Score` | 상반기 점수 | Decimal | 1차 평가 결과 또는 상반기 점수 |
| `cust_h2Score` | 하반기 점수 | Decimal | 2차 평가 결과 또는 하반기 점수 |
| `cust_totalScore` | 최종 합산 점수 | Decimal | 계산 로직이 적용된 최종 점수 |
| `cust_calcFormula` | 계산 방식 | String | 합산 시 적용된 공식 기록용 |

---

## 3. 활용 가이드 (Implementation Note)

1. **평가 Inbox 필터링**: 애플리케이션 시작 시 `cust_PMPeriodMapping`을 조회하여 현재 활성화된 카테고리와 기간 목록을 가져옵니다. 
2. **참조 연동**: PM Form 상세 화면 로딩 시 매핑된 `cust_360TemplateId`가 있다면, 해당 유저의 360 평가 결과를 슬라이드 혹은 팝업으로 노출합니다.
3. **점수 합산 프로세스**: 
   - 1차/2차 평가 완료 시점에 API를 통해 각 점수를 `cust_PMSummaryScores`에 저장.
   - 모든 데이터가 수집되면 정의된 공식에 따라 `cust_totalScore` 산출.
   - 최종 산출된 점수를 `FormHeader` 혹은 `FormContent`의 최종 등급 필드에 `upsert`하여 반영.

---

## 4. 보안 및 향후 아키텍처 개선 사항 (CAP 전환)

현재 프론트엔드에서 SuccessFactors OData API를 직접 호출하고 있으나, 사용자 식별자(`userId`)가 포함된 모든 쿼리는 보안 취약점 노출 방지를 위해 다음과 같은 개선이 필요합니다.

1. **CAP 미들웨어 도입**: 
   - 프론트엔드가 아닌 SAP BTP의 CAP 레이어에서 `principal propagation`을 통해 세션을 처리하도록 전환.
   - 프론트엔드는 본인의 `userId`를 직접 인자로 전달하지 않고, CAP 서비스가 JWT 토큰의 사용자 정보를 바탕으로 SF API를 호출하도록 구성.
2. **보안 강화**: 
   - URL 파라미터에 사용자 ID가 노출되지 않도록 서버 측에서 필터링을 강제하도록 구현.
   - `FormFolder`, `FormHeader` 등 사용자 데이터 접근 시 권한 검증 로직을 CAP 서비스 핸들러에 구현.

---
*Created: 2026-02-13 | Last Updated: 2026-02-13 11:48*
