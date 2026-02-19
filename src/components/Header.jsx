/**
 * Project: react-sfsf-viewer
 * File: /src/components/Header.jsx
 * Description: 상단 헤더 컴포넌트 (LOTTE CI 적용 & 네비게이션 고정)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Bell, Search, Users, Settings,
    Globe, LogOut, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

const Header = ({ profile, photo, activeTab, onNavigate }) => {
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

    const navItems = [
        { id: 'CAREER', label: t('nav.myCareer') || '나의 커리어' },
        { id: 'MY_EVAL', label: t('nav.myEvaluations') || '나의 평가' },
        { id: 'WRITE_EVAL', label: t('nav.writeEvaluation') || '평가서 작성' }
    ];

    // Lotte Brand Color
    const LOTTE_RED = '#DA291C';

    return (
        <header className="bg-white sticky top-0 z-40 border-b border-slate-200 px-6 h-16 flex items-center justify-between shadow-sm">

            {/* Left Section: Logo & Navigation */}
            <div className="flex items-center gap-10">
                {/* Branding */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center">
                        <img
                            src="/lotte_logo.png"
                            alt="LOTTE"
                            className="h-8 w-auto min-w-[32px] object-contain"
                            onError={(e) => {
                                // 이미지 로드 실패 시 텍스트 로고로 대체
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <span className="hidden text-2xl font-black tracking-tighter" style={{ color: LOTTE_RED }}>LOTTE</span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-300 hidden sm:block"></div>
                    <span className="text-slate-500 font-bold tracking-tight text-sm sm:text-base whitespace-nowrap">
                        LOTTE <span className="text-slate-400 font-light">Assessment</span>
                    </span>
                </div>

                {/* Main Navigation Fix: 3-menu list */}
                <nav className="hidden md:flex items-center">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate && onNavigate(item.id)}
                            className={`px-5 py-5 text-sm font-bold transition-all relative ${activeTab === item.id
                                    ? 'text-[#DA291C]'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {item.label}
                            {activeTab === item.id && (
                                <div
                                    className="absolute bottom-0 left-0 w-full h-[3px] rounded-t-sm"
                                    style={{ backgroundColor: LOTTE_RED }}
                                ></div>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Right Section: Icons & User */}
            <div className="flex items-center gap-4">
                {/* Search (Desktop) */}
                <div className="relative hidden lg:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search for forms, users..."
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#DA291C] rounded-full text-xs focus:outline-none w-48 xl:w-64 transition-all"
                    />
                </div>

                {/* Notifications */}
                <button className="p-2 text-slate-400 hover:text-[#DA291C] hover:bg-red-50 rounded-full transition-colors relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span
                            className="absolute top-1.5 right-1.5 w-4 h-4 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white"
                            style={{ backgroundColor: LOTTE_RED }}
                        >
                            {unreadCount}
                        </span>
                    )}
                </button>

                <div className="h-6 w-[1px] bg-slate-200"></div>

                {/* User Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group"
                    >
                        <div className="hidden sm:block text-right mr-1">
                            <p className="text-xs font-bold text-slate-700 group-hover:text-[#DA291C] transition-colors leading-none">
                                {profile ? `${profile.firstName} ${profile.lastName}` : t('common.loading')}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
                                {profile?.title || 'User'}
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md transition-shadow">
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

                    {/* Menu Content */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                <p className="text-sm font-extrabold text-slate-800">
                                    {profile ? `${profile.firstName} ${profile.lastName}` : t('common.guest')}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {profile?.email || 'user@lotte.com'}
                                </p>
                            </div>

                            <div className="py-1">
                                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-[#DA291C] transition-colors">
                                    <Settings size={14} />
                                    <span>{t('nav.settings') || 'Settings'}</span>
                                </button>

                                <div className="px-4 py-2 mt-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Globe size={12} /> {t('nav.language') || 'Language'}
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
                                                        ? 'text-white'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
                                                    }`}
                                                style={language === lang.code ? { backgroundColor: LOTTE_RED, borderColor: LOTTE_RED } : {}}
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
                                    <span>{t('nav.logout') || 'Logout'}</span>
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
