/**
 * Project: react-sfsf-viewer
 * File: /src/services/sfService.js
 * Description: SuccessFactors OData API 호출 서비스 (Managed AppRouter 최적화 버전)
 */

import axios from 'axios';

// --- 토큰 및 세션 관리를 위한 전역 변수 ---
let cachedCsrfToken = null;
let isFetchingToken = false;

// API 인스턴스 설정
const api = axios.create({
    baseURL: '',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Managed AppRouter 표준 보안 헤더
        'X-SF-Session-Verify': '1' // 세션 유효성 강제 검증 헤더
    },
});

/**
 * [디버그 로그] CSRF 및 세션 관련 정보를 콘솔에 상세히 출력
 */
const logCSRF = (msg, data = '') => {
    console.log(`%c[CSRF-SAFE] ${msg}`, 'background: #e0f2fe; color: #0369a1; font-weight: bold; padding: 2px 4px; border-radius: 4px;', data);
};

/**
 * [Interceptors] Request: 저장된 토큰 주입
 */
api.interceptors.request.use(
    async (config) => {
        const method = config.method?.toUpperCase();
        logCSRF(`Request: ${method} ${config.url}`);

        // 쓰기 작업 시 토큰 주입
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            if (!cachedCsrfToken) {
                logCSRF('No cached token found. Fetching from AppRouter...');
                cachedCsrfToken = await fetchAppRouterToken();
            }
            config.headers['x-csrf-token'] = cachedCsrfToken;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * [Interceptors] Response: 오직 403 에러 발생 시에만 토큰 갱신에 관여
 */
api.interceptors.response.use(
    (response) => {
        // 성공 응답 시에는 별도의 토큰 캡처를 수행하지 않음 (세션 일관성 유지)
        if (response.headers['x-sf-session-valid']) {
            logCSRF('Session Validated by SFSF');
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 403 Forbidden(CSRF 만료) 발생 시 자동 갱신 및 재시도
        if (error.response?.status === 403 && !originalRequest._retry) {
            logCSRF('403 Forbidden Detected. Token might be expired. Retrying...');
            originalRequest._retry = true;

            cachedCsrfToken = null; // 기존 토큰 무효화
            const newToken = await fetchAppRouterToken();

            if (newToken) {
                originalRequest.headers['x-csrf-token'] = newToken;
                logCSRF('Retrying original request with new AppRouter token');
                return api(originalRequest);
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Managed AppRouter(user-api)로부터 CSRF 토큰을 획득하는 함수
 */
const fetchAppRouterToken = async () => {
    if (isFetchingToken) {
        while (isFetchingToken) { await new Promise(r => setTimeout(r, 100)); }
        return cachedCsrfToken;
    }

    try {
        isFetchingToken = true;
        logCSRF('Fetching fresh CSRF token from Managed AppRouter (user-api)...');

        // SFSF API가 아닌 AppRouter 레벨의 API에 요청하여 AppRouter가 발급한 토큰을 받음
        const response = await api.get('user-api/currentUser', {
            headers: { 'x-csrf-token': 'fetch' }
        });

        const token = response.headers['x-csrf-token'] || response.headers['X-CSRF-Token'];
        logCSRF('AppRouter Token Secured:', token);

        cachedCsrfToken = token;
        return token;
    } catch (error) {
        logCSRF('CRITICAL: Failed to refresh AppRouter token', error.message);
        return null;
    } finally {
        isFetchingToken = false;
    }
};

export const sfService = {
    /**
     * 1. 현재 로그인한 사용자 정보 가져오기 (Backend CAP API 활용)
     * SuccessFactors OData User API 권한이 없는 사용자를 위해 구축된 
     * /api/projman/SFSF_User 경로를 호출하여 userId를 확보합니다.
     */
    getCurrentUser: async () => {
        try {
            logCSRF('Fetching user identification from Backend API...');

            // 1. AppRouter 기본 정보 (name 필드 등) 확인
            const appRouterResponse = await api.get('user-api/currentUser');
            const appRouterUser = appRouterResponse.data;

            // 2. 전용 Backend API를 통해 실제 SF userId 매핑 정보 가져오기
            // 리턴 구조: {"value": [{"userId": "ronald.lee", ...}]}
            const backendUserResponse = await api.get('api/projman/SFSF_User');
            const backendUserData = backendUserResponse.data.value?.[0];

            if (backendUserData) {
                logCSRF('User identified via Backend API:', backendUserData.userId);
                return {
                    ...appRouterUser,
                    userId: backendUserData.userId,
                    username: backendUserData.username,
                    displayName: backendUserData.defaultFullName || appRouterUser.displayName,
                    email: backendUserData.email || appRouterUser.email
                };
            }

            logCSRF('Warning: Backend API returned no user data. Falling back to AppRouter info.');
            return {
                ...appRouterUser,
                userId: appRouterUser.name // Fallback
            };
        } catch (error) {
            console.error('Failed to get current user via Backend API:', error);
            // 최후의 수단으로 AppRouter 정보만이라도 반환
            try {
                const fallback = await api.get('user-api/currentUser');
                return { ...fallback.data, userId: fallback.data.name };
            } catch (e) {
                throw error;
            }
        }
    },

    /**
     * 2. 사용자 프로필 상세 정보 조회
     */
    getUserProfile: async (userId) => {
        try {
            const response = await api.get(`SuccessFactors_API/odata/v2/User('${userId}')`);
            return response.data.d;
        } catch (error) {
            console.error(`Failed to get profile for ${userId}:`, error);
            throw error;
        }
    },

    /**
     * 3. 사용자 사진 조회
     */
    getUserPhoto: async (userId, photoType = 1) => {
        try {
            const response = await api.get(
                `SuccessFactors_API/odata/v2/Photo(photoType=${photoType},userId='${userId}')`
            );
            if (response.data.d.photo) {
                return `data:image/jpeg;base64,${response.data.d.photo}`;
            }
            return null;
        } catch (error) {
            console.warn(`No photo found for ${userId}`);
            return null;
        }
    },

    /**
     * 4. 인사 이력 (Job History) 조회
     */
    getJobHistory: async (userId) => {
        try {
            const response = await api.get(
                `SuccessFactors_API/odata/v2/EmpJob`,
                {
                    params: {
                        $filter: `userId eq '${userId}'`,
                        $expand: 'eventNav,companyNav,departmentNav',
                        $orderby: 'startDate desc',
                    },
                }
            );
            return response.data.d.results;
        } catch (error) {
            console.error(`Failed to get job history for ${userId}:`, error);
            throw error;
        }
    },

    /**
     * 6. 평가 마스터 매핑 (MDF) 조회
     */
    getPMPeriodMapping: async () => {
        try {
            const response = await api.get('SuccessFactors_API/odata/v2/cust_PMPeriodMapping', {
                params: { $filter: "cust_isActive eq true" }
            });
            return response.data.d.results;
        } catch (error) {
            console.error('Failed to get PM period mapping:', error);
            return [];
        }
    },

    /**
     * 7. 평가 폴더 및 평가서 목록 조회
     */
    getPerformanceFolders: async (userId) => {
        try {
            const response = await api.get('SuccessFactors_API/odata/v2/FormFolder', {
                params: {
                    $filter: `userId eq '${userId}'`,
                    $expand: 'forms/formHeader',
                    $select: 'folderId,folderName,forms/formContentId,forms/formHeader/formDataId,forms/formHeader/formTitle,forms/formHeader/currentStep,forms/formHeader/formLastModifiedDate'
                }
            });
            return response.data.d.results;
        } catch (error) {
            console.error('Failed to get performance folders:', error);
            throw error;
        }
    },

    /**
     * 8. 평가서 상세 데이터 조회 (Optimized 2-Step Loading)
     */
    async getFormDetail(formContentId, formDataId) {
        try {
            const baseResponse = await api.get(`SuccessFactors_API/odata/v2/FormContent(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                params: { $expand: 'formHeader' }
            });
            const formObj = baseResponse.data.d;

            try {
                const detailResponse = await api.get(`SuccessFactors_API/odata/v2/FormPMReviewContentDetail(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                    params: {
                        $expand: [
                            'introductionSection',
                            'objectiveSections/objectives/selfRatingComment',
                            'objectiveSections/objectives/officialRating',
                            'objectiveSections/objectives/othersRatingComment',
                            'competencySections/competencies/selfRatingComment',
                            'competencySections/competencies/officialRating',
                            'competencySections/competencies/othersRatingComment',
                            'summarySection/selfRatingComment',
                            'summarySection/overallFormRating',
                            'summarySection/othersRatingComment',
                            'customSections'
                        ].join(',')
                    }
                });

                formObj.pmReviewContentDetail = {
                    results: [detailResponse.data.d]
                };
            } catch (detailErr) {
                console.warn(`[PM Detail] Targeting error`, detailErr.message);
            }

            return formObj;
        } catch (error) {
            console.error(`Failed to get form detail for ${formContentId}:`, error);
            throw error;
        }
    },

    /**
     * 8-1. 360 다면평가 상세 데이터 조회 (504 타임아웃 방지를 위해 호출 분할)
     */
    async getForm360Detail(formContentId, formDataId) {
        try {
            logCSRF('Starting 2-Step 360 Detail Load to prevent 504 Timeout');

            // STEP 1: 기본 정보 및 참가자, 요약 정보 로드
            const baseResponse = await api.get(`SuccessFactors_API/odata/v2/FormContent(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                params: { $expand: 'formHeader' }
            });
            const formObj = baseResponse.data.d;

            try {
                const step1Response = await api.get(`SuccessFactors_API/odata/v2/Form360ReviewContentDetail(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                    params: {
                        $expand: [
                            'introductionSection',
                            'participantSection',
                            'form360RaterSection/form360Raters',
                            'summaryViewSection/formRaters',
                            'summarySection/overallFormRating',
                            'summarySection/selfRatingComment'
                        ].join(',')
                    }
                });
                Object.assign(formObj, step1Response.data.d);

                // STEP 2: 무거운 성과, 역량, 커스텀 섹션 로드
                const step2Response = await api.get(`SuccessFactors_API/odata/v2/Form360ReviewContentDetail(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                    params: {
                        $expand: [
                            'objectiveSections/objectives/selfRatingComment',
                            'objectiveSections/objectives/othersRatingComment',
                            'competencySections/competencies/selfRatingComment',
                            'competencySections/competencies/othersRatingComment',
                            'customSections'
                        ].join(',')
                    }
                });
                Object.assign(formObj, step2Response.data.d);

            } catch (detailErr) {
                console.warn(`[360 Detail] Partial loading error / Timeout`, detailErr.message);
            }

            return formObj;
        } catch (error) {
            console.error(`Failed to get 360 form detail:`, error);
            throw error;
        }
    },

    /**
     * 8-1. 평가 Route Map 조회
     */
    getFormRouteMap: async (formDataId) => {
        try {
            const response = await api.get(`SuccessFactors_API/odata/v2/FormRouteMap(formDataId=${formDataId}L)`, {
                params: {
                    $expand: 'routeStep,routeStep/routeSubStep',
                    $format: 'json'
                }
            });
            return response.data.d;
        } catch (error) {
            console.error(`Failed to get route map for ${formDataId}:`, error);
            return null;
        }
    },

    /**
     * 9. 평가 점수 업데이트 (Upsert/PATCH)
     */
    updateFormRating: async (data) => {
        try {
            // 인터셉터가 토큰 주입 및 만료 시 재시도를 자동으로 처리합니다.
            const response = await api.post('SuccessFactors_API/odata/v2/upsert', data);
            return response.data;
        } catch (error) {
            console.error('Failed to update form rating:', error);
            throw error;
        }
    },

    /**
     * 10. PM 평가 다음 단계로 전송
     */
    sendToNextStep: async (formDataId, options = {}) => {
        try {
            const { comment } = options;
            let url = `SuccessFactors_API/odata/v2/sendToNextStep?formDataId=${formDataId}L`;
            if (comment) url += `&comment='${encodeURIComponent(comment)}'`;

            const response = await api.get(url);
            return response.data.d || response.data;
        } catch (error) {
            console.error(`Failed to send form ${formDataId} to next step:`, error);
            throw error;
        }
    },

    /**
     * 11. 360 평가 완료 처리
     */
    complete360: async (formDataId) => {
        try {
            const response = await api.get(`SuccessFactors_API/odata/v2/complete360?formDataId=${formDataId}L`);
            return response.data.d || response.data;
        } catch (error) {
            console.error(`Failed to complete 360 form ${formDataId}:`, error);
            throw error;
        }
    }
};
