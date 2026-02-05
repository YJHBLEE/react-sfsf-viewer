# EmpJob (Job Information) Entity Metadata

## 개요
- **엔티티 이름**: `EmpJob`
- **레이블**: Job Information
- **설명**: 직책, 직무 코드, 부서 등 직원의 이력 데이터를 포함하는 엔티티입니다. 특정 기간 동안의 모든 직무 변경 사항을 조회하는 데 유용합니다.
- **주요 태그**: Employee Central (EC), EC - Employment Information, Recommended

## 주요 키 (Entity Keys)
이 엔티티를 고유하게 식별하기 위해 다음 세 가지 필드가 필요합니다.
1. `seqNumber` (Sequence Number)
2. `startDate` (Event Date)
3. `userId` (User ID)

## 상세 속성 (Properties)

| 속성명 (Property Name) | 타입 (Type) | 레이블 (Label) | 필수여부 | 픽리스트 (Picklist) |
| :--- | :--- | :--- | :---: | :--- |
| **userId** | Edm.String | User ID | Yes | - |
| **startDate** | Edm.DateTime | Event Date | Yes | - |
| **seqNumber** | Edm.Int64 | Sequence Number | Yes | - |
| **jobTitle** | Edm.String | Job Title | Yes | - |
| **jobCode** | Edm.String | Job Classification | Yes | - |
| **eventReason** | Edm.String | Event Reason | Yes | - |
| **company** | Edm.String | Company | Yes | - |
| **businessUnit** | Edm.String | Business Unit | Yes | - |
| **location** | Edm.String | Location | Yes | - |
| **position** | Edm.String | Position | Yes | - |
| **department** | Edm.String | Department | No | - |
| **division** | Edm.String | Division | No | - |
| **payGrade** | Edm.String | Pay Grade | No | - |
| **managerId** | Edm.String | Supervisor | No | - |
| **emplStatus** | Edm.String | Employee Status | No | employee-status |
| **employmentType** | Edm.String | Employment Type | No | employmentType |
| **employeeClass** | Edm.String | Employee Class | No | EMPLOYEECLASS |
| **regularTemp** | Edm.String | Regular/Temporary | No | regular-temp |
| **standardHours** | Edm.Double | Standard Weekly Hours | No | - |
| **fte** | Edm.Double | FTE | No | - |
| **timezone** | Edm.String | Timezone | Yes | - |
| **payScaleType** | Edm.String | Pay Scale Type | Yes | - |
| **payScaleArea** | Edm.String | Pay Scale Area | Yes | - |
| **payScaleGroup** | Edm.String | Pay Scale Group | No | - |
| **payScaleLevel** | Edm.String | Pay Scale Level | No | - |
| **costCenter** | Edm.String | Cost Center | No | - |
| **notes** | Edm.String | Notes | No | - |
| **createdDateTime** | Edm.DateTimeOffset | Created Date Time | No | - |
| **lastModifiedDateTime** | Edm.DateTimeOffset | Last Modified Date Time | No | - |

## 주요 필드 설명 및 개발 팁

### 1. 날짜 및 시간 처리
- `startDate`와 `endDate`는 `Edm.DateTime` 타입입니다. UI5에서 바인딩 시 `sap.ui.model.type.Date`를 사용하여 포맷팅하십시오.
- `createdDateTime`과 `lastModifiedDateTime`은 `DateTimeOffset`으로 서버의 타임스탬프 정보를 포함합니다.

### 2. 필수 필드 (Required Fields)
- 데이터를 생성(Upsert)할 때 `userId`, `startDate`, `jobTitle`, `jobCode`, `eventReason`, `company`, `businessUnit`, `location`, `position`, `timezone`, `payScaleType`, `payScaleArea`는 반드시 포함되어야 합니다.

### 3. 픽리스트 (Picklists)
- `emplStatus`, `employmentType`, `employeeClass` 등은 SuccessFactors 내부 픽리스트와 연결되어 있습니다. 해당 필드의 값은 픽리스트의 `Option ID` 또는 `External Code`를 사용합니다.

### 4. 필터링 및 정렬
- `userId`를 기준으로 필터링하여 특정 사용자의 이력을 조회할 수 있습니다.
- `startDate`를 기준으로 내림차순 정렬(`$orderby=startDate desc`)하여 최신 직무 정보를 먼저 가져오는 패턴이 자주 사용됩니다.

```javascript
// 예시: OData Read 호출 시 파라미터 구성
const oParams = {
    "$filter": "userId eq 'sfadmin'",
    "$orderby": "startDate desc",
    "$expand": "eventNav,eventReasonNav,managerUserNav" // Navigation 속성 활용
};
```

## 참고 사항
- 이 엔티티는 `upsertable`이 `true`이므로 데이터 업데이트 및 삽입이 가능하지만, `creatable`과 `updatable`이 `false`인 경우가 많으므로 일반적인 `POST/PUT` 대신 `upsert` 작업을 주로 사용합니다.
- `effectiveLatestChange` 필드를 활용하면 현재 시점에서 가장 최신인 레코드만 필터링할 수 있습니다.