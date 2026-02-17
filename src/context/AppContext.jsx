/**
 * Project: react-sfsf-viewer
 * File: /src/context/AppContext.jsx
 * Description: 앱 전역 상태(유저 설정, 다국어, 알림 등)를 관리하는 컨텍스트
 */

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import i18n from 'i18next';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    // 1. 다국어 상태 (초기값은 i18n 설정값을 따름)
    const [language, setLanguage] = useState(i18n.language || 'ko');

    // 언어 변경 시 i18next 적용
    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language]);

    // 2. 알림 상태
    const [notifications, setNotifications] = useState([
        { id: 1, title: '성과 목표 알림', message: '3개의 성과 목표가 승인 대기 중입니다.', type: 'info', read: false },
    ]);

    // 3. 앱 설정 (SuccessFactors Custom MDF에서 로드될 데이터)
    const [appSettings, setAppSettings] = useState({
        theme: 'light',
        sidebarExpanded: true,
        featureFlags: {
            enableEvaluation: true,
            enableEducation: false
        }
    });

    // 4. 현재 로그인 유저 정보 (인증 및 userId 매핑 결과 저장)
    const [currentUser, setCurrentUser] = useState(null);

    // 알림 읽음 처리 기능
    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    // 컨텍스트 값 메모이제이션 (성능 최적화)
    const value = useMemo(() => ({
        language,
        setLanguage,
        notifications,
        setNotifications,
        appSettings,
        setAppSettings,
        currentUser,
        setCurrentUser,
        markAsRead,
        unreadCount: notifications.filter(n => !n.read).length
    }), [language, notifications, appSettings, currentUser]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// 컨텍스트를 쉽게 사용하기 위한 커스텀 훅
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
