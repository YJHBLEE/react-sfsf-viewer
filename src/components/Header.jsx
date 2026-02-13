/**
 * Project: react-sfsf-viewer
 * File: /src/components/Header.jsx
 * Description: 상단 헤더 컴포넌트 (통합 검색 및 전역 유저 메뉴/언어 변경 포함)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Bell, Search, ChevronRight, Users, Settings,
    Globe, LogOut, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

const Header = ({ profile, photo }) => {
    const { t } = useTranslation();
    const { unreadCount, language, setLanguage } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // 외부 클릭 시 메뉴 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const languages = [
        { code: 'ko', label: '한국어' },
        { code: 'en', label: 'English' },
        { code: 'jp', label: '日本語' }
    ];

    return (
        <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-200 px-6 h-14 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span className="hover:text-slate-800 cursor-pointer">{t('header.employees')}</span>
                <ChevronRight size={14} />
                <span className="text-slate-800 font-bold">
                    {profile ? `${profile.lastName}, ${profile.firstName}` : t('common.loading')}
                </span>
            </div>

            <div className="flex items-center gap-3">
                {/* 통합 검색창 */}
                <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder={t('header.searchPlaceholder')}
                        className="pl-8 pr-3 py-1.5 bg-slate-100 border border-transparent focus:bg-white focus:border-indigo-200 rounded text-xs focus:outline-none w-64 transition-all"
                    />
                </div>

                <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

                {/* 알림 버튼 */}
                <button className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-md transition-colors relative">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border border-white">
                            {unreadCount}
                        </span>
                    )}
                </button>

                {/* 유저 아바타 및 드롭다운 메뉴 */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-1 p-0.5 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200">
                            {photo ? (
                                <img src={photo} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Users size={16} />
                                </div>
                            )}
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* 드롭다운 메뉴 내용 */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* 유저 정보 요약 */}
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-extrabold text-slate-800">
                                    {profile ? `${profile.firstName} ${profile.lastName}` : t('common.guest')}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {profile?.title || t('common.systemUser')}
                                </p>
                            </div>

                            {/* 메뉴 리스트 */}
                            <div className="py-1">
                                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                    <Settings size={14} />
                                    <span>{t('nav.settings')}</span>
                                </button>

                                {/* 언어 선택 서브 메뉴 */}
                                <div className="px-4 py-2 mt-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Globe size={12} /> {t('nav.language')}
                                    </p>
                                    <div className="grid grid-cols-3 gap-1">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setLanguage(lang.code);
                                                    setIsMenuOpen(false);
                                                }}
                                                className={`py-1 rounded text-[10px] font-bold border transition-all ${language === lang.code
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-1 border-t border-slate-100 pt-1">
                                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                                    <LogOut size={14} />
                                    <span>{t('nav.logout')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
