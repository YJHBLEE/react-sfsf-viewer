# SAP BTP Managed AppRouter CSRF 해결 가이드

## 1. 배경
SAP BTP 환경에서 SuccessFactors OData API를 호출하는 React App을 개발하던 중, 배포 환경에서만 지속적으로 `403 Forbidden (CSRF Token Validation Failed)` 오류가 발생함. 로컬 환경(Vite Proxy)에서는 문제 없었으나, BTP Managed AppRouter(Launchpad 서비스)를 거치는 순간 세션 유지와 토큰 검증이 실패함.

## 2. 시행착오와 오답노트
*   **시도 1: SuccessFactors API($metadata)에서 토큰 직접 Fetch**
    *   **결과**: 실패. Managed AppRouter가 백엔드에서 오는 `JSESSIONID` 쿠키를 브라우저로 온전히 전달하지 않거나, AppRouter 자체가 자신의 토큰을 요구함.
*   **시도 2: xs-app.json에서 csrfProtection: false 설정**
    *   **결과**: 실패. AppRouter 보호는 꺼지더라도 백엔드 SFSF 서버가 CSRF를 요구하며, 이때 세션 쿠키가 누락되어 검증 불가.
*   **시도 3: X-Requested-With: X 헤더 사용**
    *   **결과**: 일부 우회는 가능하나 Managed AppRouter 인프라 환경에서는 여전히 토큰을 요구함.

## 3. 결정적 해결책 (Key Findings)
Managed AppRouter 환경에서 "우리가 마주하는 첫 번째 서버"는 SFSF가 아니라 **SAP Managed AppRouter 인프라**임. 따라서 CSRF 토큰은 백엔드가 아닌 **AppRouter로부터 직접 발급**받아야 함.

### 핵심 조치 사항:
1.  **xs-app.json 설정**: 
    *   `csrfProtection: true`로 활성화 (AppRouter가 토큰을 발행하도록 함)
    *   `tokenHandler: { "type": "standard" }` 적용 (AppRouter가 백엔드 토큰을 대신 핸들링하도록 위임)
2.  **토큰 획득 경로 변경**: 
    *   SFSF API 경로가 아닌, AppRouter 자체 서비스인 `user-api/currentUser` 경로에 `x-csrf-token: fetch` 헤더를 담아 요청을 보냄.
    *   이때 반환받은 토큰은 AppRouter가 인정하는 토큰이며, 이를 백엔드 호출 시 사용하면 AppRouter가 중간에서 백엔드용 토큰으로 변환해 주거나 통과시킴.

## 4. 최종 구현 로직 (sfService.js)
1.  앱 시작 또는 쓰기 요청 직전 `user-api/currentUser`를 호출하여 첫 토큰을 확보.
2.  모든 POST/PUT 요청 헤더에 해당 토큰을 주입.
3.  만약 토큰이 만료되어 403이 발생하면, **Interceptor**가 가로채서 다시 `user-api/currentUser`를 호출해 토큰을 갱신하고 재시도(Retry)함.

## 5. 결론
"BTP Managed AppRouter 환경에서는 백엔드의 CSRF 정책보다 **AppRouter의 CSRF 정책이 우선**한다. 토큰 fetch의 대상은 언제나 `user-api`와 같은 AppRouter 접점이어야 한다."
