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
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProfileHeader from './components/ProfileHeader';
import PerformanceInbox from './components/PerformanceInbox';
import InfoCard from './components/InfoCard';
import TimelineItem from './components/TimelineItem';

const App = () => {
  const { t } = useTranslation();
  const { profile, photo, jobHistory, loading, error } = useSFData();
  const [activeTab, setActiveTab] = useState('overview');

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
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-lg border border-red-100 shadow-sm max-w-sm text-center">
          <p className="text-red-500 font-bold mb-2">{t('common.errorTitle')}</p>
          <p className="text-xs text-slate-500">{t('common.errorMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-900">

      {/* 좌측 사이드바 */}
      <Sidebar
        profile={profile}
        photo={photo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 md:ml-56 relative">

        {/* 상단 헤더 */}
        <Header profile={profile} photo={photo} />

        <div className="p-5 max-w-6xl mx-auto space-y-4">
          {activeTab === 'performance' ? (
            <PerformanceInbox userId={profile?.userId} />
          ) : (
            <>
              {/* 프로필 헤더 (탭 포함) */}
              <ProfileHeader
                profile={profile}
                photo={photo}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />

              {/* 메인 콘텐츠 그리드 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                {/* 좌측 컬럼: 연락처 및 기술 스택 */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-slate-800">{t('profile.contactInfo')}</h3>
                      <button className="text-slate-400 hover:text-indigo-600"><Link2 size={14} /></button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <InfoCard icon={Mail} label="Email Address" value={profile?.email} />
                      <InfoCard icon={Phone} label="Business Phone" value={profile?.businessPhone} />
                      <InfoCard icon={Phone} label="Cell Phone" value={profile?.cellPhone || t('profile.notRegistered')} />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">{t('profile.skills')}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {['SAP SuccessFactors', 'React', 'Fiori', 'JavaScript', 'Team Leadership'].map(skill => (
                        <span key={skill} className="px-2.5 py-1 bg-[#F1F3F5] text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-md hover:border-slate-300 transition-colors cursor-default">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 우측 컬럼: 탭 내용 (Overview / Job History 등) */}
                <div className="lg:col-span-8">
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg border-l-4 border-indigo-500 p-4 shadow-sm flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{t('activity.pendingActions')}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{t('activity.pendingMessage', { count: 3 })}</p>
                        </div>
                        <button className="text-xs font-semibold text-indigo-600 hover:underline">{t('activity.review')}</button>
                      </div>

                      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                          <h3 className="text-sm font-bold text-slate-800">{t('activity.recentJob')}</h3>
                          <button
                            onClick={() => setActiveTab('jobhistory')}
                            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                          >
                            {t('activity.viewAll')}
                          </button>
                        </div>
                        <div className="pt-1 pl-1">
                          {jobHistory.slice(0, 3).map((job, idx) => (
                            <TimelineItem key={idx} job={job} isLast={idx === 2 || idx === jobHistory.length - 1} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {(activeTab === 'profile' || activeTab === 'jobhistory') && (
                    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-5">{t('profile.tabs.jobhistory')}</h3>
                      <div className="pl-1">
                        {jobHistory.map((job, idx) => (
                          <TimelineItem key={idx} job={job} isLast={idx === jobHistory.length - 1} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;