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
     * 8. 평가서 상세 데이터 조회 (Deep Load)
     */
    getFormDetail: async (formContentId, formDataId) => {
        try {
            // 복합 키를 사용하여 FormContent 조회 (L 접미사 포함)
            const response = await api.get(`SuccessFactors_API/odata/v2/FormContent(formContentId=${formContentId}L,formDataId=${formDataId}L)`, {
                params: {
                    $expand: 'formHeader,pmReviewContentDetail/objectiveSections/objectives/selfRatingComment,pmReviewContentDetail/competencySections/competencies/selfRatingComment,pmReviewContentDetail/summarySection/selfRatingComment,pmReviewContentDetail/summarySection/overallFormRating,pmReviewContentDetail/introductionSection',
                }
            });
            return response.data.d;
        } catch (error) {
            console.error(`Failed to get form detail for ${formContentId}:`, error);
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
