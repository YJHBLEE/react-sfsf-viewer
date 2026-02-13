/**
 * Project: react-sfsf-viewer
 * File: /src/components/PerformanceInbox.jsx
 * Description: 평가 Inbox (To-do) 리스트 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ClipboardList, Calendar, ChevronRight, Filter,
    AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { sfService } from '../services/sfService';

import PerformanceDetail from './PerformanceDetail';

const PerformanceInbox = ({ userId }) => {
    const { t } = useTranslation();
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFolderName, setActiveFolderName] = useState('Inbox');
    const [activeType, setActiveType] = useState('ALL');
    const [selectedForm, setSelectedForm] = useState(null);

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

        if (userId) {
            fetchFolders();
        }
    }, [userId]);

    // 상세 화면이 선택된 경우 해당 컴포넌트 렌더링
    if (selectedForm) {
        return (
            <PerformanceDetail
                form={selectedForm}
                onBack={() => setSelectedForm(null)}
            />
        );
    }

    // 데이터 가공 및 필터링
    const activeFolder = folders.find(f => f.folderName === activeFolderName);
    const allFormsInFolder = activeFolder?.forms?.results?.map(f => ({
        ...f.formHeader,
        formContentId: f.formContentId,
        // 360 평가 판별 (제목에 360이 포함되거나 특정 패턴 확인)
        displayType: f.formHeader?.formTitle?.includes('360') ? '360' : 'PM'
    })) || [];

    // 유형별 카운트 계산
    const counts = {
        ALL: allFormsInFolder.length,
        PM: allFormsInFolder.filter(f => f.displayType === 'PM').length,
        '360': allFormsInFolder.filter(f => f.displayType === '360').length
    };

    // 최종 필터링된 목록
    const forms = allFormsInFolder.filter(f => {
        if (activeType === 'ALL') return true;
        return f.displayType === activeType;
    });

    const folderCategories = folders.map(f => ({
        id: f.folderName,
        label: f.folderName
    }));

    const typeCategories = [
        { id: 'ALL', label: '전체' },
        { id: 'PM', label: '성과평가' },
        { id: '360', label: '360 다면평가' }
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-slate-500 font-medium">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 타이틀 영역 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                        <ClipboardList className="text-indigo-600" size={24} />
                        {t('pm.inboxTitle')}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{activeFolderName} Documents</p>
                </div>

                {/* 상태(Folder) 필터 */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    {folderCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setActiveFolderName(cat.id);
                                setActiveType('ALL'); // 폴더 변경 시 유형은 전체로 초기화
                            }}
                            className={`px-4 py-2 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap border ${activeFolderName === cat.id
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 유형(PM vs 360) 필터 탭 */}
            <div className="flex items-center gap-8 border-b border-slate-100 overflow-x-auto scrollbar-hide">
                {typeCategories.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setActiveType(type.id)}
                        className={`pb-4 text-xs font-black transition-all relative whitespace-nowrap ${activeType === type.id
                            ? 'text-indigo-600'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {type.label}
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${activeType === type.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {counts[type.id]}
                            </span>
                        </div>
                        {activeType === type.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full animate-in fade-in slide-in-from-bottom-1"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* 리스트 영역 */}
            {forms.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <CheckCircle2 size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-slate-800 font-bold mb-1">{t('pm.noForms')}</h3>
                    <p className="text-slate-500 text-xs text-balance">
                        현재 처리해야 할 성과 평가서가 없습니다. <br className="hidden sm:block" />
                        모든 작업을 완수하셨군요!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {forms.map((form) => (
                        <div
                            key={form.formDataId}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                    <ClipboardList size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                            {form.formTitle}
                                        </h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-[10px] font-bold text-indigo-600 border border-indigo-100">
                                            2024 상반기
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {t('pm.card.currentStep', { step: form.currentStep })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} /> {t('pm.card.dueDate', { date: '2024-06-30' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                                <button
                                    onClick={() => setSelectedForm(form)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm group-hover:scale-[1.02]"
                                >
                                    {t('pm.card.openForm')}
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 추가 정보/가이드 영역 (확장성) */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                    <b>도움말:</b> 각 평가서는 SuccessFactors 표준 프로세스를 따릅니다. <br />
                    단계별로 필요한 항목을 모두 입력한 후 'Next Step' 버튼을 눌러야 다음 평가자에게 전달됩니다.
                </p>
            </div>
        </div>
    );
};

export default PerformanceInbox;
