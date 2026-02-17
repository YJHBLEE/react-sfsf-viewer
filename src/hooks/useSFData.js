/**
 * Project: react-sfsf-viewer
 * File: /src/hooks/useSFData.js
 * Description: SuccessFactors 데이터를 가져오고 로딩/에러 상태를 관리하는 커스텀 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { sfService } from '../services/sfService';
import { useApp } from '../context/AppContext';

export const useSFData = () => {
    const { setCurrentUser } = useApp();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        user: null,
        profile: null,
        photo: null,
        jobHistory: [],
        settings: null
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Backend API를 통해 유저 및 프로필 정보를 통합 획득
            const userWithProfile = await sfService.getCurrentUser();
            const userId = userWithProfile.userId;

            // 2. Context에 전역 유저 정보 저장
            setCurrentUser(userWithProfile);

            // 3. 획득한 userId를 기반으로 나머지 후속 데이터만 로딩 (성능 최적화)
            // 권한 이슈가 잦은 OData getUserProfile은 더 이상 호출하지 않습니다.
            const [photo, jobHistory] = await Promise.all([
                sfService.getUserPhoto(userId),
                sfService.getJobHistory(userId),
            ]);

            setData({
                user: userWithProfile,
                profile: userWithProfile, // Backend API 정보가 곧 프로필이 됨
                photo,
                jobHistory,
                settings: null
            });
        } catch (err) {
            console.error('Error fetching SF data:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [setCurrentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 필요시 데이터를 다시 불러올 수 있는 refresh 함수도 함께 반환
    return { ...data, loading, error, refresh: fetchData };
};
