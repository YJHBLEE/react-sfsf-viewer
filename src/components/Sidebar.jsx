/**
 * Project: react-sfsf-viewer
 * File: /src/components/Sidebar.jsx
 * Description: 좌측 사이드바 컴포넌트 (개인화 메뉴 및 프로필 요약 포함)
 */

import React from 'react';
import {
    LayoutDashboard, Users, Award, GraduationCap,
    FileText, Settings, ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 group ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
    >
        <Icon size={16} className={active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
        <span className="font-medium text-xs tracking-wide">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
    </div>
);

const Sidebar = ({ profile, photo, activeTab, setActiveTab }) => {
    const { t } = useTranslation();
    const { appSettings } = useApp();
    const { featureFlags } = appSettings;

    return (
        <aside className="w-56 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-50">
            {/* 로고 영역 */}
            <div className="h-14 flex items-center gap-2 px-5 border-b border-slate-100">
                <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    SF
                </div>
                <span className="font-bold text-sm tracking-tight text-slate-800">
                    Talent<span className="text-indigo-600">View</span>
                </span>
            </div>

            {/* 메뉴 영역 */}
            <div className="px-3 py-4 flex-1 overflow-y-auto">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('nav.workspace')}</p>
                <div className="space-y-0.5">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label={t('nav.dashboard')}
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <SidebarItem
                        icon={Users}
                        label={t('nav.myProfile')}
                        active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                    />

                    {/* Feature Flag에 따른 유동적 메뉴 노출 (확장성) */}
                    {featureFlags.enableEvaluation && (
                        <SidebarItem
                            icon={Award}
                            label={t('nav.performance')}
                            active={activeTab === 'performance'}
                            onClick={() => setActiveTab('performance')}
                        />
                    )}
                    {featureFlags.enableEducation && (
                        <SidebarItem
                            icon={GraduationCap}
                            label={t('nav.learning')}
                            active={activeTab === 'learning'}
                            onClick={() => setActiveTab('learning')}
                        />
                    )}

                    <SidebarItem icon={FileText} label={t('nav.documents')} />
                </div>

                {/* 설정 및 관리자 메뉴 (확장성) */}
                <div className="mt-6">
                    <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('nav.preferences')}</p>
                    <div className="space-y-0.5">
                        <SidebarItem icon={Settings} label={t('nav.preferences')} />
                        <SidebarItem icon={ShieldCheck} label={t('nav.adminConsole')} />
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
