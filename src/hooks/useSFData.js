/**
 * Project: react-sfsf-viewer
 * File: /src/hooks/useSFData.js
 * Description: SuccessFactors 데이터를 가져오고 로딩/에러 상태를 관리하는 커스텀 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { sfService } from '../services/sfService';

export const useSFData = () => {
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
            // 1. 현재 로그인 세션 확인
            const currentUser = await sfService.getCurrentUser();
            const userId = currentUser.name || 'sfadmin'; // 로컬 테스트용 기본값

            // 2. 병렬 데이터 로딩 (성능 최적화)
            const [profile, photo, jobHistory] = await Promise.all([
                sfService.getUserProfile(userId),
                sfService.getUserPhoto(userId),
                sfService.getJobHistory(userId),
            ]);

            setData({
                user: currentUser,
                profile,
                photo,
                jobHistory,
                settings: null // 향후 Custom MDF 설정 데이터 연결부
            });
        } catch (err) {
            console.error('Error fetching SF data:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 필요시 데이터를 다시 불러올 수 있는 refresh 함수도 함께 반환
    return { ...data, loading, error, refresh: fetchData };
};
