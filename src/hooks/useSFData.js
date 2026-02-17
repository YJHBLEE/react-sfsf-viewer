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
            // 1. 현재 로그인 세션 확인 및 Backend API를 통한 userId 매핑
            const currentUser = await sfService.getCurrentUser();
            const userId = currentUser.userId;

            // 2. Context에 전역 유저 정보 저장
            setCurrentUser(currentUser);

            // 3. 병렬 데이터 로딩 (성능 최적화)
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
