/**
 * Project: react-sfsf-viewer
 * File: /src/services/sfService.js
 * Description: SuccessFactors OData API 호출을 관리하는 서비스 모듈 (CSRF & Session 최적화 버전)
 */

import axios from 'axios';

// --- 토큰 및 세션 관리를 위한 전역 변수 ---
let cachedCsrfToken = null;
let isFetchingToken = false;

// API 인스턴스 설정
const api = axios.create({
    baseURL: '',
    withCredentials: true, // 쿠키 및 세션 유지를 위해 필수
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * [Interceptors] Request: 토큰 자동 주입 및 Proactive Fetching
 */
api.interceptors.request.use(
    (config) => {
        const method = config.method?.toUpperCase();

        // 1. 모든 GET 요청 시 토큰 획득 시도 (Proactive Fetching)
        if (method === 'GET') {
            config.headers['x-csrf-token'] = 'fetch';
        }

        // 2. 쓰기 요청 시 캐싱된 토큰 주입
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            if (cachedCsrfToken) {
                config.headers['x-csrf-token'] = cachedCsrfToken;
            } else {
                config.headers['x-csrf-token'] = 'fetch';
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * [Interceptors] Response: 토큰 자동 캡처 및 403 에러 발생 시 재시도
 */
api.interceptors.response.use(
    (response) => {
        // 응답 헤더에서 토큰 캡처
        const token = response.headers['x-csrf-token'] || response.headers['X-CSRF-Token'];
        if (token && !['required', 'fetch', 'none'].includes(token.toLowerCase())) {
            cachedCsrfToken = token;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // CSRF 토큰 만료(403) 시 자동 갱신 및 재시도 로직
        if (error.response?.status === 403 && !originalRequest._retry) {
            const tokenMsg = error.response.headers?.['x-csrf-token'];
            if (tokenMsg?.toLowerCase() === 'required' || error.response.data?.error?.message?.value?.includes('CSRF')) {
                originalRequest._retry = true;
                cachedCsrfToken = null;

                // 토큰 재취득 (새로운 세션 쿠키와 토큰 확보)
                const newToken = await fetchCsrfToken();
                if (newToken) {
                    originalRequest.headers['x-csrf-token'] = newToken;
                    // 원래 요청 재수행
                    return api(originalRequest);
                }
            }
        }
        return Promise.reject(error);
    }
);

/**
 * CSRF 토큰 획득 함수 (Proactive & Reactive Hybrid)
 */
const fetchCsrfToken = async () => {
    if (cachedCsrfToken) return cachedCsrfToken;

    // 중복 호출 방지 (Lock)
    if (isFetchingToken) {
        let retries = 0;
        while (isFetchingToken && retries < 50) {
            await new Promise(r => setTimeout(r, 100));
            retries++;
        }
        return cachedCsrfToken;
    }

    try {
        isFetchingToken = true;
        // 가장 빠른 응답을 주는 API로 토큰과 쿠키 획득
        await api.get('SuccessFactors_API/odata/v2/$metadata');
        return cachedCsrfToken;
    } catch (error) {
        console.error('[sfService] Fails to fetch CSRF token:', error);
        return null;
    } finally {
        isFetchingToken = false;
    }
};

export const sfService = {
    /**
     * 1. 현재 로그인한 사용자 정보 가져오기
     */
    getCurrentUser: async () => {
        try {
            const response = await api.get('user-api/currentUser');
            const username = response.data.name;

            if (!username) return response.data;

            try {
                const sfUserResponse = await api.get('SuccessFactors_API/odata/v2/User', {
                    params: {
                        $filter: `username eq '${username}'`,
                        $select: 'userId,username,displayName,email'
                    }
                });

                const sfUser = sfUserResponse.data.d.results?.[0];
                if (sfUser) {
                    return {
                        ...response.data,
                        userId: sfUser.userId,
                        displayName: sfUser.displayName || response.data.displayName
                    };
                }
            } catch (sfErr) {
                console.warn('Failed to map username to userId', sfErr);
            }

            return response.data;
        } catch (error) {
            console.error('Failed to get current user:', error);
            throw error;
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
            // STEP 1: 기본 정보(Header)만 가볍게 조회
            const baseResponse = await api.get(`SuccessFactors_API/odata/v2/FormContent(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                params: { $expand: 'formHeader' }
            });
            const formObj = baseResponse.data.d;

            // STEP 2: 상세 내용 엔티티 조회
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
     * 8-1. 360 다면평가 상세 데이터 조회
     */
    async getForm360Detail(formContentId, formDataId) {
        try {
            const baseResponse = await api.get(`SuccessFactors_API/odata/v2/FormContent(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                params: { $expand: 'formHeader' }
            });
            const formObj = baseResponse.data.d;

            try {
                const detailResponse = await api.get(`SuccessFactors_API/odata/v2/Form360ReviewContentDetail(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                    params: {
                        $expand: 'introductionSection,participantSection,form360RaterSection/form360Raters,summaryViewSection/formRaters,summarySection/overallFormRating',
                    }
                });
                Object.assign(formObj, detailResponse.data.d);
            } catch (detailErr) {
                console.warn(`[360 Detail] Targeting error`, detailErr.message);
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
            // 토큰이 확보된 상태에서 요청 (인터셉터가 헤더 주입)
            await fetchCsrfToken();
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
    }
};
