/**
 * Project: react-sfsf-viewer
 * File: /src/services/sfService.js
 * Description: SuccessFactors OData API 호출을 관리하는 서비스 모듈
 */

import axios from 'axios';

// API 인스턴스 설정 (BTP 환경의 상대 경로 대응을 위해 baseURL을 빈 값으로 설정)
const api = axios.create({
    baseURL: '',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const sfService = {
    /**
     * 1. 현재 로그인한 사용자 정보 가져오기 (AppRouter user-api)
     */
    getCurrentUser: async () => {
        try {
            const response = await api.get('user-api/currentUser');
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
     * 5. [확장] Custom MDF 정보 조회 (설정 데이터 등)
     */
    getCustomSettings: async (externalCode) => {
        try {
            const response = await api.get(`SuccessFactors_API/odata/v2/cust_AppSettings('${externalCode}')`);
            return response.data.d;
        } catch (error) {
            console.warn(`Settings for ${externalCode} not found`);
            return null;
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
     * 모든 폴더(Inbox, En Route, Completed 등)의 정보를 가져와 folderName별로 구분 가능하게 함
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
     * 8. 팀원 평가 현황 조회 (매니저용)
     * formSubjectId(피평가자) 필드를 사용하여 특정 대상의 평가서 목록 조회
     */
    getTeamPerformanceForms: async (subjectId) => {
        try {
            const response = await api.get('SuccessFactors_API/odata/v2/FormHeader', {
                params: {
                    $filter: `formSubjectId eq '${subjectId}'`,
                    $orderby: 'formLastModifiedDate desc',
                    $select: 'formDataId,formSubjectId,formTitle,formDataStatus,formLastModifiedDate,currentStep'
                }
            });
            return response.data.d.results;
        } catch (error) {
            console.error('Failed to get team performance forms:', error);
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

            // STEP 2: 상세 내용 엔티티가 존재하는지 확인 후 개별 조회 (타겟팅 조회)
            try {
                const detailResponse = await api.get(`SuccessFactors_API/odata/v2/FormPMReviewContentDetail(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                    params: {
                        $expand: 'objectiveSections/objectives/selfRatingComment,competencySections/competencies/selfRatingComment,summarySection/selfRatingComment,summarySection/overallFormRating,introductionSection,customSections'
                    }
                });

                // 조회된 상세 데이터를 기본 객체에 병합 (기존 UI 호환을 위해 배열 results 형태로 가공)
                formObj.pmReviewContentDetail = {
                    results: [detailResponse.data.d]
                };
            } catch (detailErr) {
                console.warn(`[PM Detail] This form template might not support targeting FormPMReviewContentDetail directly.`, detailErr.message);
            }

            return formObj;
        } catch (error) {
            console.error(`Failed to get form detail for ${formContentId}:`, error);
            throw error;
        }
    },

    /**
     * 8-1. 360 다면평가 상세 데이터 조회 (Optimized 2-Step Loading)
     */
    async getForm360Detail(formContentId, formDataId) {
        try {
            // STEP 1: 기본 정보 조회
            const baseResponse = await api.get(`SuccessFactors_API/odata/v2/FormContent(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                params: { $expand: 'formHeader' }
            });
            const formObj = baseResponse.data.d;

            // STEP 2: 360 전용 상세 엔티티 조회 (타겟팅 조회)
            try {
                const detailResponse = await api.get(`SuccessFactors_API/odata/v2/Form360ReviewContentDetail(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                    params: {
                        $expand: 'summarySection/selfRatingComment,summarySection/overallFormRating,competencySections/competencies/selfRatingComment,objectiveSections/objectives/selfRatingComment,introductionSection,participantSection,form360RaterSection/form360Raters,summaryViewSection/formRaters,summaryViewSection/categoryWeights,userInformationSection,customSections/customItems/selfRatingComment',
                    }
                });

                // 360 상세 데이터를 기본 객체의 속성으로 병합
                Object.assign(formObj, detailResponse.data.d);
            } catch (detailErr) {
                console.warn(`[360 Detail] This form template might not support targeting Form360ReviewContentDetail directly.`, detailErr.message);
            }

            return formObj;
        } catch (error) {
            console.error(`Failed to get 360 form detail for ${formContentId}:`, error);
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
            const response = await api.post('SuccessFactors_API/odata/v2/upsert', data);
            return response.data;
        } catch (error) {
            console.error('Failed to update form rating:', error);
            throw error;
        }
    }
};
