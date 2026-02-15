/**
 * Project: react-sfsf-viewer
 * File: /src/components/360MultiRaterDetailView.jsx
 * Description: 360 다면평가(Multi-Rater) 전용 상세 뷰 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, Target, Award, MessageSquare, Info,
    Clock, FileText, ChevronRight, Users, BarChart3, Star,
    User, Brain, Zap, TrendingUp, Save, Send
} from 'lucide-react';
import { sfService } from '../services/sfService';
import RouteMapStepView from './RouteMapStepView';

const _360MultiRaterDetailView = ({ form, onBack }) => {
    const { t } = useTranslation();
    const [detail, setDetail] = useState(null);
    const [routeMap, setRouteMap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState([]);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [inputs, setInputs] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                // 360 전용 API 호출
                const [data, routeData] = await Promise.all([
                    sfService.getForm360Detail(form.formContentId, form.formDataId),
                    sfService.getFormRouteMap(form.formDataId)
                ]);

                setDetail(data);
                setRouteMap(routeData);

                const dynamicSections = [];
                const initialInputs = {};
                const content = data;

                // 1. 임직원 정보 (User Information Section)
                if (content.userInformationSection) {
                    dynamicSections.push({
                        id: 'user_info',
                        title: content.userInformationSection.sectionName || 'Employee Information',
                        type: 'user_info',
                        data: content.userInformationSection,
                        icon: User
                    });
                }

                // 2. 소개 섹션
                if (content.introductionSection) {
                    dynamicSections.push({
                        id: 'intro',
                        title: content.introductionSection.sectionName || 'Introduction',
                        type: 'intro',
                        data: content.introductionSection,
                        icon: Info
                    });
                }

                // 3. 목표 섹션 (컬렉션 처리)
                const objSections = content.objectiveSections?.results || [];
                objSections.forEach((sec, sidx) => {
                    const sId = `obj_${sidx}`;
                    dynamicSections.push({
                        id: sId,
                        title: sec.sectionName || 'Objectives',
                        type: 'objective',
                        data: sec,
                        icon: Target
                    });

                    sec.objectives?.results?.forEach((obj, oidx) => {
                        const key = `${sId}_${oidx}`;
                        initialInputs[key] = {
                            rating: obj.selfRatingComment?.rating ? String(parseFloat(obj.selfRatingComment.rating)) : '',
                            comment: obj.selfRatingComment?.comment || '',
                            ratingKey: obj.selfRatingComment?.ratingKey,
                            commentKey: obj.selfRatingComment?.commentKey
                        };
                    });
                });

                // 4. 역량 및 스킬 섹션 통합 처리 (attributeType 'COMPETENCY', 'SKILL' 활용)
                const rawCompSections = content.competencySections?.results || [];
                const rawCustomSections = content.customSections?.results || [];

                // SKILL 섹션을 추출하여 Competency 구조로 변환
                const extractedSkills = rawCustomSections
                    .filter(sec => sec.attributeType === 'SKILL')
                    .map(sec => ({
                        ...sec,
                        competencies: { results: sec.customItems?.results || [] }
                    }));

                // 기존 COMPETENCY 섹션과 추출된 SKILL 섹션 병합
                const mergedCompSections = [...rawCompSections, ...extractedSkills];

                mergedCompSections.forEach((sec, sidx) => {
                    const sId = `comp_${sidx}`;
                    dynamicSections.push({
                        id: sId,
                        title: sec.sectionName || 'Competency Feedback',
                        type: 'competency',
                        data: sec,
                        icon: Award
                    });

                    sec.competencies?.results?.forEach((comp) => {
                        const key = `${sId}_${comp.itemId}`;
                        initialInputs[key] = {
                            rating: comp.selfRatingComment?.rating ? String(parseFloat(comp.selfRatingComment.rating)) : '',
                            comment: comp.selfRatingComment?.comment || '',
                            ratingKey: comp.selfRatingComment?.ratingKey,
                            commentKey: comp.selfRatingComment?.commentKey
                        };
                    });
                });

                // 5. 기타 커스텀 섹션 (STRENGTH, DEVELOPMENT 등 - SKILL은 이미 위에서 처리)
                const remainingCustomSections = rawCustomSections.filter(sec => sec.attributeType !== 'SKILL');

                remainingCustomSections.forEach((sec, idx) => {
                    let icon = Brain;
                    const attrType = sec.attributeType;

                    if (attrType === 'STRENGTH') icon = Zap;
                    if (attrType === 'DEVELOPMENT') icon = TrendingUp;

                    const sId = `custom_${idx}`;
                    dynamicSections.push({
                        id: sId,
                        title: sec.sectionName,
                        type: 'custom',
                        data: sec,
                        icon: icon
                    });

                    // 개별 항목 초기값 설정
                    sec.customItems?.results?.forEach((item) => {
                        const key = `${sId}_${item.itemId}`;
                        initialInputs[key] = {
                            rating: item.selfRatingComment?.rating ? String(parseFloat(item.selfRatingComment.rating)) : '',
                            comment: item.selfRatingComment?.comment || '',
                            ratingKey: item.selfRatingComment?.ratingKey,
                            commentKey: item.selfRatingComment?.commentKey
                        };
                    });
                });

                // 6. 요약 섹션 (Overall Rating)
                if (content.summarySection) {
                    dynamicSections.push({
                        id: 'summary',
                        title: content.summarySection.sectionName || 'Overall Average Rating',
                        type: 'summary',
                        data: content.summarySection,
                        icon: Star
                    });
                    initialInputs['summary'] = {
                        rating: content.summarySection.overallFormRating?.rating ? String(parseFloat(content.summarySection.overallFormRating.rating)) : '',
                        comment: content.summarySection.selfRatingComment?.comment || '',
                        ratingKey: content.summarySection.selfRatingComment?.ratingKey,
                        commentKey: content.summarySection.selfRatingComment?.commentKey
                    };
                }

                // 7. 평가자 목록 섹션 (Rater Section)
                if (content.form360RaterSection) {
                    dynamicSections.push({
                        id: 'raters',
                        title: content.form360RaterSection.sectionName || 'Rater List',
                        type: '360_raters',
                        data: content.form360RaterSection,
                        icon: Users
                    });
                }

                // 8. 다면평가 요약 뷰 섹션 (Summary View Section)
                if (content.summaryViewSection) {
                    dynamicSections.push({
                        id: 'summary_view',
                        title: content.summaryViewSection.sectionName || 'Result Summary',
                        type: '360_summary_view',
                        data: content.summaryViewSection,
                        icon: BarChart3
                    });
                }

                setSections(dynamicSections);
                setInputs(initialInputs);
                if (dynamicSections.length > 0) {
                    setActiveSectionId(dynamicSections[0].id);
                }
            } catch (error) {
                console.error('Failed to load 360 form detail', error);
            } finally {
                setLoading(false);
            }
        };

        if (form) fetchDetail();
    }, [form]);

    const handleInputChange = (key, field, value) => {
        setInputs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        // TODO: 360 전용 Upsert 로직 구현 (PMDetailView와 유사하지만 엔티티명이 다름)
        alert('360 평가 저장 기능은 준비 중입니다.');
    };

    const handleSubmit = async () => {
        if (!window.confirm(t('common.confirmSubmit360'))) {
            return;
        }

        try {
            setIsSubmitting(true);
            // 360 저장 기능이 구현되면 여기에 await handleSave() 추가 예정

            const result = await sfService.complete360(form.formDataId);

            // 성공 여부 확인
            if (result === 'Success' || result?.status === 'Success' || result?.d?.status === 'Success') {
                alert(t('common.submitSuccess'));
                onBack();
            } else {
                throw new Error(result?.status || 'Unknown error');
            }
        } catch (error) {
            console.error('Failed to complete 360 form', error);
            const errorData = error.response?.data?.error;
            const errorMessage = errorData?.message?.value || error.message;
            alert(`${t('common.submitError')}\n\n[${errorData?.code || 'ERROR'}] ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const cleanHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest text-[#&apos;]">{t('common.loading')}</p>
            </div>
        );
    }

    const activeSection = sections.find(s => s.id === activeSectionId);

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-20">
            {/* 상단 컨트롤러 */}
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={onBack}
                    className="group px-4 py-2.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <ChevronLeft size={16} className="text-slate-400 group-hover:text-purple-600" />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{t('common.back')}</span>
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="group px-6 py-2.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 hover:border-purple-200 hover:bg-purple-50 transition-all shadow-sm disabled:opacity-50"
                    >
                        <Save size={16} className="text-slate-400 group-hover:text-purple-600" />
                        <span className="text-xs font-black text-slate-600 group-hover:text-purple-700 uppercase tracking-tight">
                            {isSaving ? t('common.saving') : t('common.save')}
                        </span>
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isSaving}
                        className="group px-6 py-2.5 bg-purple-600 text-white rounded-2xl flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 hover:scale-[1.02] border border-purple-500 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Send size={16} />
                        )}
                        <span className="text-xs font-black uppercase tracking-tight">
                            {isSubmitting ? t('common.submitting') : t('common.submit')}
                        </span>
                    </button>
                </div>
            </div>

            {/* 헤더 정보 */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">
                            <Clock size={12} />
                            360 MULTI-RATER
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{detail?.formTitle || form.formTitle}</h2>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <FileText size={14} className="text-slate-400" />
                                {detail?.subjectUserName || detail?.subjectUserId}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Route Map (모듈화 완료) */}
                <RouteMapStepView routeMap={routeMap} color="purple" title="Process Timeline" />
            </div>

            {/* 레이아웃 메인 */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* LNB */}
                <div className="w-full lg:w-80 shrink-0 space-y-1.5 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm h-fit sticky top-4 z-20">
                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">360 Review Sections</p>
                    {sections.map(sec => (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSectionId(sec.id)}
                            className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-left transition-all group ${activeSectionId === sec.id
                                ? 'bg-purple-600 text-white shadow-xl shadow-purple-100 scale-[1.02]'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <sec.icon size={18} className={activeSectionId === sec.id ? 'text-white' : 'text-slate-300 group-hover:text-purple-400'} />
                                <span className="text-xs font-black tracking-tight leading-tight">{sec.title}</span>
                            </div>
                            <ChevronRight size={14} className={activeSectionId === sec.id ? 'opacity-100' : 'opacity-0'} />
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 w-full min-w-0">
                    {activeSection?.type === 'user_info' && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><User size={24} /></div>
                                {activeSection.title}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</span>
                                        <span className="text-sm font-bold text-slate-700">{detail.subjectUser?.lastName}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</span>
                                        <span className="text-sm font-bold text-slate-700">{detail.subjectUser?.firstName}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</span>
                                        <span className="text-sm font-bold text-slate-700">{detail.subjectUser?.title || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</span>
                                        <span className="text-sm font-bold text-slate-700">{detail.subjectUser?.department || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hire Date</span>
                                        <span className="text-sm font-bold text-slate-700">
                                            {detail.subjectUser?.hireDate ? new Date(parseInt(detail.subjectUser.hireDate.match(/\d+/)[0])).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'intro' && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Info size={20} /></div>
                                {activeSection.title}
                            </h3>
                            <div
                                className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
                                dangerouslySetInnerHTML={{ __html: activeSection.data.sectionDescription }}
                            />
                        </div>
                    )}

                    {activeSection?.type === 'objective' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-black text-slate-800 px-2">{activeSection.data.sectionName}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {activeSection.data.objectives?.results?.map((obj, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:border-indigo-200 transition-all group">
                                        <div className="flex flex-col space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">{idx + 1}</div>
                                                        <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-700">{obj.name}</h4>
                                                    </div>
                                                    <div
                                                        className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100 italic [&_p]:mb-1 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                                                        dangerouslySetInnerHTML={{ __html: obj.metric }}
                                                    />
                                                </div>
                                                <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 min-w-[140px]">
                                                    <p className="text-[10px] text-indigo-400 font-black uppercase mb-3 tracking-widest text-center">Your Rating</p>
                                                    <div className="flex gap-1 justify-center">
                                                        {[1, 2, 3, 4, 5].map(v => (
                                                            <button
                                                                key={v}
                                                                onClick={() => handleInputChange(`${activeSection.id}_${idx}`, 'rating', String(v))}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${parseFloat(v) === parseFloat(inputs[`${activeSection.id}_${idx}`]?.rating || 0) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-200'}`}
                                                            >
                                                                {v}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1 mb-2">Comments</label>
                                                <textarea
                                                    value={inputs[`${activeSection.id}_${idx}`]?.comment || ''}
                                                    onChange={(e) => handleInputChange(`${activeSection.id}_${idx}`, 'comment', e.target.value)}
                                                    className="w-full bg-slate-50/30 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:ring-8 focus:ring-indigo-50 focus:border-indigo-200 transition-all min-h-[100px]"
                                                    placeholder="평가 의견을 작성해 주세요..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'competency' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-black text-slate-800 px-2">{activeSection.data.sectionName}</h3>

                            {/* 섹션 설명 (Introduction) 추가 - HTML 태그 적용 */}
                            {activeSection.data.sectionDescription && (
                                <div
                                    className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium mx-2 mb-4 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
                                    dangerouslySetInnerHTML={{ __html: activeSection.data.sectionDescription }}
                                />
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                {activeSection.data.competencies?.results?.map((comp, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:border-purple-200 transition-all group">
                                        <div className="flex flex-col space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">{idx + 1}</div>
                                                        <h4 className="text-lg font-black text-slate-900 group-hover:text-purple-700">{comp.name}</h4>
                                                    </div>
                                                    <div
                                                        className="text-xs text-slate-500 font-medium leading-relaxed pl-1 max-w-2xl [&_p]:mb-1 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                                                        dangerouslySetInnerHTML={{ __html: comp.description }}
                                                    />
                                                </div>
                                                <div className="bg-purple-50 p-4 rounded-3xl border border-purple-100 min-w-[140px]">
                                                    <p className="text-[10px] text-purple-400 font-black uppercase mb-3 tracking-widest text-center">Your Rating</p>
                                                    <div className="flex gap-1 justify-center">
                                                        {[1, 2, 3, 4, 5].map(v => (
                                                            <button
                                                                key={v}
                                                                onClick={() => handleInputChange(`${activeSection.id}_${comp.itemId}`, 'rating', String(v))}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${parseFloat(v) === parseFloat(inputs[`${activeSection.id}_${comp.itemId}`]?.rating || 0) ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-white border-slate-200 text-slate-300 hover:border-purple-200'}`}
                                                            >
                                                                {v}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1 mb-2">Feedback Comments</label>
                                                <textarea
                                                    value={inputs[`${activeSection.id}_${comp.itemId}`]?.comment || ''}
                                                    onChange={(e) => handleInputChange(`${activeSection.id}_${comp.itemId}`, 'comment', e.target.value)}
                                                    className="w-full bg-slate-50/30 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:ring-8 focus:ring-purple-50 focus:border-purple-200 transition-all min-h-[100px]"
                                                    placeholder="발현 사례 및 피드백을 작성해 주세요..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'custom' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black text-slate-800">{activeSection.data.sectionName}</h3>
                            </div>

                            {/* 섹션 설명 (Introduction) 추가 - HTML 태그 적용 */}
                            {activeSection.data.sectionDescription && (
                                <div
                                    className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed mx-2 mb-4 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
                                    dangerouslySetInnerHTML={{ __html: activeSection.data.sectionDescription }}
                                />
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                {activeSection.data.customItems?.results?.length > 0 ? (
                                    // 개별 항목(Strength, Development 등)이 있는 경우
                                    activeSection.data.customItems.results.map((item, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:border-indigo-200 transition-all group">
                                            <div className="flex flex-col space-y-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">{idx + 1}</div>
                                                            <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-700">{item.name}</h4>
                                                        </div>
                                                        {item.description && (
                                                            <div
                                                                className="text-xs text-slate-500 font-medium leading-relaxed pl-1 [&_p]:mb-1 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                                                                dangerouslySetInnerHTML={{ __html: item.description }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100 min-w-[140px] ml-4">
                                                        <p className="text-[10px] text-indigo-400 font-black uppercase mb-3 tracking-widest text-center">Rating</p>
                                                        <div className="flex gap-1 justify-center">
                                                            {[1, 2, 3, 4, 5].map(v => (
                                                                <button
                                                                    key={v}
                                                                    onClick={() => handleInputChange(`${activeSection.id}_${item.itemId}`, 'rating', String(v))}
                                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${parseFloat(v) === parseFloat(inputs[`${activeSection.id}_${item.itemId}`]?.rating || 0) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-200'}`}
                                                                >
                                                                    {v}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1 mb-2">Comments</label>
                                                    <textarea
                                                        value={inputs[`${activeSection.id}_${item.itemId}`]?.comment || ''}
                                                        onChange={(e) => handleInputChange(`${activeSection.id}_${item.itemId}`, 'comment', e.target.value)}
                                                        className="w-full bg-slate-50/30 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:ring-8 focus:ring-indigo-50 focus:border-indigo-200 transition-all min-h-[100px]"
                                                        placeholder="의견을 작성해 주세요..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // 개별 항목 없이 섹션 피드백만 있는 경우
                                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
                                        <div className="space-y-4">
                                            <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1">Section Feedback</label>
                                            <textarea
                                                value={inputs[activeSection.id]?.comment || ''}
                                                onChange={(e) => handleInputChange(activeSection.id, 'comment', e.target.value)}
                                                className="w-full bg-slate-50/30 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-8 focus:ring-indigo-50 focus:border-indigo-200 transition-all min-h-[150px]"
                                                placeholder="이 섹션에 대한 종합적인 의견을 작성해 주세요..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'summary' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-black text-slate-800 px-2">{activeSection.title}</h3>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                    <div className="lg:col-span-4 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100">
                                        <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-purple-100">
                                            <Star size={28} fill="currentColor" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Overall Rating</p>
                                        <div className="flex gap-1.5 justify-center flex-wrap">
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => handleInputChange('summary', 'rating', String(v))}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border transition-all ${parseFloat(v) === parseFloat(inputs['summary']?.rating || 0) ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-100 scale-110' : 'bg-white border-slate-200 text-slate-300 hover:border-purple-200'}`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-8 space-y-4">
                                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1">Comprehensive Comments</label>
                                        <textarea
                                            value={inputs['summary']?.comment || ''}
                                            onChange={(e) => handleInputChange('summary', 'comment', e.target.value)}
                                            className="w-full bg-slate-50/30 border border-slate-100 rounded-3xl px-6 py-5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-8 focus:ring-purple-50 focus:border-purple-200 transition-all min-h-[200px]"
                                            placeholder="다면평가 전체를 아우르는 종합 의견을 작성해 주세요..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection?.type === '360_raters' && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Users size={24} /></div>
                                {activeSection.title}
                            </h3>
                            <div className="overflow-hidden border border-slate-100 rounded-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-medium text-xs">
                                        {activeSection.data.form360Raters?.results?.map((rater, ridx) => (
                                            <tr key={ridx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight">
                                                        {rater.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 font-bold">{rater.participantFullName}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${rater.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                        <span className={rater.status === 'Completed' ? 'text-emerald-600 font-bold' : 'text-slate-500'}>{rater.status}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection?.type === '360_summary_view' && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><BarChart3 size={24} /></div>
                                {activeSection.title}
                            </h3>
                            <div className="space-y-8">
                                {(!activeSection.data.formRaters?.results || activeSection.data.formRaters.results.length === 0) ? (
                                    <p className="p-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-widest">요약 데이터가 없습니다.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {activeSection.data.formRaters.results.map((rater, ridx) => (
                                            <div key={ridx} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:border-purple-200 transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                                        {rater.raterCategory}
                                                    </span>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-black text-slate-900">{parseFloat(rater.rating || 0).toFixed(1)}</span>
                                                        <span className="text-[10px] font-black text-slate-300 ml-1">/ 5.0</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${(parseFloat(rater.rating || 0) / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default _360MultiRaterDetailView;
