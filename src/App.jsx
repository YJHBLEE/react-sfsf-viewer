/**
 * Project: react-sfsf-viewer
 * File: /src/App.jsx
 * Description: 리팩토링된 메인 애플리케이션 컴포넌트
 */

import React, { useState } from 'react';
import { Mail, Phone, Link2 } from 'lucide-react';

// Hooks & Context
import { useSFData } from './hooks/useSFData';
import { useTranslation } from 'react-i18next';

// Components

import Header from './components/Header';
import PerformanceInbox from './components/PerformanceInbox';
import MyCareer from './components/MyCareer';
import MyEvaluations from './components/MyEvaluations';
import ErrorPage from './pages/ErrorPage';

const App = () => {
  const { t } = useTranslation();
  const { profile, photo, jobHistory, loading, error } = useSFData();
  const [activeTab, setActiveTab] = useState('CAREER'); // Default to Dashboard

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium animate-pulse">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'CAREER':
        return <MyCareer profile={profile} />;
      case 'MY_EVAL':
        return <MyEvaluations />;
      case 'WRITE_EVAL':
        return <PerformanceInbox userId={profile?.userId} />;
      default:
        return <MyCareer profile={profile} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-900">

      {/* 메인 콘텐츠 영역 (Full width) */}
      <main className="flex-1 relative w-full">

        {/* 상단 헤더 */}
        <Header
          profile={profile}
          photo={photo}
          activeTab={activeTab}
          onNavigate={setActiveTab}
        />

        <div className="w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;