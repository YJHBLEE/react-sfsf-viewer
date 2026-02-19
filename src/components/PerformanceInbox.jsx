/**
 * Project: react-sfsf-viewer
 * File: /src/components/PerformanceInbox.jsx
 * Description: 평가 Inbox (평가서 작성 리스트) - LOTTE CI 적용
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ClipboardList, Calendar, ChevronRight, Filter,
    AlertCircle, CheckCircle2, Clock, User, Search
} from 'lucide-react';
import { sfService } from '../services/sfService';

import PerformanceDetail from './PerformanceDetail';
import ProfileModal from './ProfileModal';

const PerformanceInbox = ({ userId }) => {
    const { t } = useTranslation();
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFolderName, setActiveFolderName] = useState('Inbox');
    const [activeType, setActiveType] = useState('ALL');
    const [selectedForm, setSelectedForm] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    const LOTTE_RED = '#DA291C';

    const mockJobHistory = [
        { startDate: '2022-01-01', endDate: 'Present', title: 'Senior Developer', department: 'IT Innovation', manager: 'Sarah Connor' },
        { startDate: '2020-03-01', endDate: '2021-12-31', title: 'Developer', department: 'IT Operations', manager: 'Kyle Reese' }
    ];

    useEffect(() => {
        const fetchFolders = async () => {
            try {
                setLoading(true);
                const data = await sfService.getPerformanceFolders(userId);
                setFolders(data || []);

                if (data && data.length > 0) {
                    const hasInbox = data.find(f => f.folderName === 'Inbox');
                    if (hasInbox) setActiveFolderName('Inbox');
                    else setActiveFolderName(data[0].folderName);
                }
            } catch (error) {
                console.error('Failed to load PM folders', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchFolders();
    }, [userId]);

    const handleAvatarClick = (form) => {
        setSelectedUser({
            firstName: form.formDataId ? 'Minji' : 'Unknown',
            lastName: form.formDataId ? 'Kim' : 'User',
            title: 'Senior Manager',
            department: 'Global Strategy',
            email: `minji.kim@lotte.net`,
            businessPhone: '+82 10-1234-5678',
            location: 'Lotte World Tower, Seoul',
            ...form
        });
    };

    if (selectedForm) {
        return <PerformanceDetail form={selectedForm} onBack={() => setSelectedForm(null)} />;
    }

    const activeFolder = folders.find(f => f.folderName === activeFolderName);
    const allFormsInFolder = activeFolder?.forms?.results?.map(f => ({
        ...f.formHeader,
        formContentId: f.formContentId,
        displayType: f.formHeader?.formTitle?.includes('360') ? '360' : 'PM'
    })) || [];

    const counts = {
        ALL: allFormsInFolder.length,
        PM: allFormsInFolder.filter(f => f.displayType === 'PM').length,
        '360': allFormsInFolder.filter(f => f.displayType === '360').length
    };

    const forms = allFormsInFolder.filter(f => {
        if (activeType === 'ALL') return true;
        return f.displayType === activeType;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-10 h-10 border-2 border-red-100 border-t-[#DA291C] rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{t('common.loading') || 'Loading Documents...'}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-10 space-y-8 animate-in fade-in duration-500">
            {/* Title & Folders */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                        <ClipboardList className="text-[#DA291C]" size={28} />
                        {t('pm.inboxTitle') || '평가서 작성'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 ml-10">
                        Current Folder: {activeFolderName}
                    </p>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    {folders.map(f => (
                        <button
                            key={f.folderName}
                            onClick={() => { setActiveFolderName(f.folderName); setActiveType('ALL'); }}
                            className={`px-5 py-2.5 rounded-full text-[11px] font-black transition-all whitespace-nowrap border shadow-sm ${activeFolderName === f.folderName
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-[#DA291C] hover:text-[#DA291C]'
                                }`}
                        >
                            {f.folderName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-100">
                {['ALL', 'PM', '360'].map(id => (
                    <button
                        key={id}
                        onClick={() => setActiveType(id)}
                        className={`pb-4 text-xs font-black transition-all relative whitespace-nowrap px-1 ${activeType === id ? 'text-[#DA291C]' : 'text-slate-400'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {id === 'ALL' ? '전체' : id === 'PM' ? '성과평가' : '360 진단'}
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${activeType === id ? 'bg-[#DA291C] text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {counts[id]}
                            </span>
                        </div>
                        {activeType === id && (
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#DA291C] rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            {forms.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
                    <CheckCircle2 size={48} className="text-slate-100 mx-auto mb-4" />
                    <h3 className="text-slate-800 font-black text-lg mb-1">처리할 문서가 없습니다</h3>
                    <p className="text-slate-400 text-xs font-medium">모든 평가 단계를 완료하셨습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {forms.map(form => (
                        <div key={form.formDataId} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-red-100 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-start gap-5">
                                <div
                                    onClick={() => handleAvatarClick(form)}
                                    className="cursor-pointer relative hover:scale-105 transition-transform shrink-0"
                                >
                                    <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                                        <User size={28} className="text-slate-300" />
                                    </div>
                                    <div
                                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                                        style={{ backgroundColor: form.displayType === '360' ? '#9333ea' : LOTTE_RED }}
                                    >
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#DA291C] transition-colors tracking-tight">
                                            {form.formTitle}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-bold tracking-tight uppercase">
                                        <span className="flex items-center gap-1.5 text-slate-600">
                                            <User size={14} className="text-slate-300" /> Minji Kim
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={14} /> Step: {form.currentStep}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-red-400">
                                            <Calendar size={14} /> Due: 2024-06-30
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedForm(form)}
                                className="flex items-center justify-center gap-2 px-6 py-3 text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                                style={{ backgroundColor: LOTTE_RED }}
                            >
                                {t('pm.card.openForm') || '평가하기'}
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Guide */}
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 flex gap-4 items-start">
                <AlertCircle size={20} className="text-[#DA291C] shrink-0 mt-0.5" />
                <div className="text-xs text-red-900 font-medium leading-relaxed">
                    <p className="font-black mb-1">LOTTE 평가 프로세스 안내</p>
                    <p className="opacity-80">성과평가는 최종 제출 전까지 임시 저장이 가능하며, '다음 단계' 버튼 클릭 시 즉시 전송됩니다. 360 진단은 익명성이 보장되므로 솔직하게 작성해 주세요.</p>
                </div>
            </div>

            {selectedUser && (
                <ProfileModal profile={selectedUser} photo={null} jobHistory={mockJobHistory} onClose={() => setSelectedUser(null)} />
            )}
        </div>
    );
};

export default PerformanceInbox;
