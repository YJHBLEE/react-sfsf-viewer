/**
 * Project: react-sfsf-viewer
 * File: /src/components/PMDetailView.jsx
 * Description: 일반 성과평가(PM v12) 전용 상세 뷰 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, Target, Award, MessageSquare, Info,
    Save, Clock, FileText, ChevronRight, Quote,
    CheckCircle2, ChevronUp, ChevronDown, Send
} from 'lucide-react';
import { sfService } from '../services/sfService';

const PMDetailView = ({ form, onBack }) => {
    const { t } = useTranslation();
    const [detail, setDetail] = useState(null);
    const [routeMap, setRouteMap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState([]);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [inputs, setInputs] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isRouteMapExpanded, setIsRouteMapExpanded] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const [data, routeData] = await Promise.all([
                    sfService.getFormDetail(form.formContentId, form.formDataId),
                    sfService.getFormRouteMap(form.formDataId)
                ]);

                setDetail(data);
                setRouteMap(routeData);

                const pmContent = data?.pmReviewContentDetail?.results?.[0];
                const dynamicSections = [];
                const initialInputs = {};

                if (pmContent) {
                    // 1. 소개 섹션
                    const intro = pmContent.introductionSection;
                    if (intro) {
                        dynamicSections.push({
                            id: 'intro',
                            title: intro.sectionName || 'Introduction',
                            type: 'intro',
                            data: intro,
                            icon: Info
                        });
                    }

                    // 2. 목표 섹션
                    const objSectionsArr = pmContent.objectiveSections?.results || [];
                    objSectionsArr.forEach((sec, sidx) => {
                        const sId = `obj_${sidx}`;
                        dynamicSections.push({
                            id: sId,
                            title: `${sec.sectionName}${sec.sectionWeight ? ` (${sec.sectionWeight}%)` : ''}`,
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

                    // 3. 역량 섹션
                    const compSectionsArr = pmContent.competencySections?.results || [];
                    compSectionsArr.forEach((sec, sidx) => {
                        const sId = `comp_${sidx}`;
                        dynamicSections.push({
                            id: sId,
                            title: `${sec.sectionName}${sec.sectionWeight ? ` (${sec.sectionWeight}%)` : ''}`,
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

                    // 4. 요약 섹션
                    const summary = pmContent.summarySection;
                    if (summary) {
                        dynamicSections.push({
                            id: 'summary',
                            title: summary.sectionName || 'Summary',
                            type: 'summary',
                            data: summary,
                            icon: MessageSquare
                        });
                        initialInputs['summary'] = {
                            rating: summary.overallFormRating?.rating ? String(parseFloat(summary.overallFormRating.rating)) : '',
                            comment: summary.selfRatingComment?.comment || '',
                            ratingKey: summary.selfRatingComment?.ratingKey,
                            commentKey: summary.selfRatingComment?.commentKey
                        };
                    }
                }

                setSections(dynamicSections);
                setInputs(initialInputs);
                if (dynamicSections.length > 0) {
                    setActiveSectionId(dynamicSections[0].id);
                }
            } catch (error) {
                console.error('Failed to load PM form detail', error);
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
        try {
            setIsSaving(true);
            const pmContent = detail?.pmReviewContentDetail?.results?.[0];
            if (!pmContent) return;

            const userId = detail.formHeader?.formSubjectId;
            const rootPayload = {
                "__metadata": {
                    "uri": `FormPMReviewContentDetail(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L)`,
                    "type": "SFOData.FormPMReviewContentDetail"
                },
                "formContentId": String(form.formContentId),
                "formDataId": String(form.formDataId)
            };

            const objectiveSections = [];
            const objSectionsArr = pmContent.objectiveSections?.results || [];
            objSectionsArr.forEach((sec, sidx) => {
                const sId = `obj_${sidx}`;
                const objectives = [];

                sec.objectives?.results?.forEach((obj, oidx) => {
                    const key = `${sId}_${oidx}`;
                    const input = inputs[key];
                    if (input) {
                        objectives.push({
                            "__metadata": {
                                "uri": `FormObjective(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${obj.itemId}L,sectionIndex=${sec.sectionIndex})`,
                                "type": "SFOData.FormObjective"
                            },
                            "itemId": String(obj.itemId),
                            "selfRatingComment": {
                                "__metadata": {
                                    "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${obj.itemId}L,ratingType='na',sectionIndex=${sec.sectionIndex},userId='${userId}')`,
                                    "type": "SFOData.FormUserRatingComment"
                                },
                                "rating": input.rating ? parseFloat(input.rating).toFixed(1) : (obj.selfRatingComment?.rating || null),
                                "comment": input.comment ?? obj.selfRatingComment?.comment,
                                "ratingKey": input.ratingKey,
                                "commentKey": input.commentKey
                            }
                        });
                    }
                });

                if (objectives.length > 0) {
                    objectiveSections.push({
                        "__metadata": {
                            "uri": `FormObjectiveSection(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,sectionIndex=${sec.sectionIndex})`,
                            "type": "SFOData.FormObjectiveSection"
                        },
                        "objectives": objectives
                    });
                }
            });

            const competencySections = [];
            const compSectionsArr = pmContent.competencySections?.results || [];
            compSectionsArr.forEach((sec, sidx) => {
                const sId = `comp_${sidx}`;
                const competencies = [];

                sec.competencies?.results?.forEach((comp) => {
                    const key = `${sId}_${comp.itemId}`;
                    const input = inputs[key];
                    if (input) {
                        competencies.push({
                            "__metadata": {
                                "uri": `FormCompetency(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${comp.itemId}L,sectionIndex=${sec.sectionIndex})`,
                                "type": "SFOData.FormCompetency"
                            },
                            "itemId": String(comp.itemId),
                            "selfRatingComment": {
                                "__metadata": {
                                    "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${comp.itemId}L,ratingType='na',sectionIndex=${sec.sectionIndex},userId='${userId}')`,
                                    "type": "SFOData.FormUserRatingComment"
                                },
                                "rating": input.rating ? parseFloat(input.rating).toFixed(1) : (comp.selfRatingComment?.rating || null),
                                "comment": input.comment ?? comp.selfRatingComment?.comment,
                                "ratingKey": input.ratingKey,
                                "commentKey": input.commentKey
                            }
                        });
                    }
                });

                if (competencies.length > 0) {
                    competencySections.push({
                        "__metadata": {
                            "uri": `FormCompetencySection(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,sectionIndex=${sec.sectionIndex})`,
                            "type": "SFOData.FormCompetencySection"
                        },
                        "competencies": competencies
                    });
                }
            });

            if (objectiveSections.length > 0) rootPayload.objectiveSections = objectiveSections;
            if (competencySections.length > 0) rootPayload.competencySections = competencySections;

            const summary = pmContent.summarySection;
            const summaryInput = inputs['summary'];
            if (summary && summaryInput) {
                // FormSummarySection 엔티티에 대한 __metadata를 제거하여 sectionIndex 관련 오류 방지
                // 상위 엔티티인 FormPMReviewContentDetail과의 1:1 관계를 통해 자동 매핑 유도
                rootPayload.summarySection = {
                    "selfRatingComment": {
                        "__metadata": {
                            "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=0L,ratingType='overall',sectionIndex=${summary.sectionIndex},userId='${userId}')`,
                            "type": "SFOData.FormUserRatingComment"
                        },
                        "rating": summaryInput.rating ? parseFloat(summaryInput.rating).toFixed(1) : (summary.selfRatingComment?.rating || null),
                        "comment": summaryInput.comment ?? summary.selfRatingComment?.comment,
                        "ratingKey": summaryInput.ratingKey,
                        "commentKey": summaryInput.commentKey
                    }
                };
            }

            await sfService.updateFormRating(rootPayload);
            alert(t('common.saveSuccess'));
        } catch (error) {
            console.error('Failed to save PM form', error);
            alert(t('common.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    const cleanHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
            </div>
        );
    }

    const activeSection = sections.find(s => s.id === activeSectionId);

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-20">
            {/* 상단 컨트롤러 */}
            <div className="grid grid-cols-2 md:flex md:items-center justify-between gap-3">
                <button
                    onClick={onBack}
                    className="group px-4 py-2.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <ChevronLeft size={16} className="text-slate-400 group-hover:text-indigo-600" />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{t('common.back')}</span>
                </button>

                <div className="flex gap-2 col-span-2 md:col-auto">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                        ) : (
                            <Save size={16} />
                        )}
                        {t('common.save')}
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform active:scale-95">
                        <Send size={16} />
                        {t('common.submit')}
                    </button>
                </div>
            </div>

            {/* 헤더 정보 */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            <Clock size={12} />
                            {detail?.formHeader?.formDataStatus || 'IN PROGRESS'}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{form.formTitle}</h2>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <FileText size={14} className="text-slate-400" />
                                {detail?.formHeader?.formSubjectId}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Route Map (Collapsible) */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                    <div
                        className="flex items-center justify-between cursor-pointer group"
                        onClick={() => setIsRouteMapExpanded(!isRouteMapExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Process Timeline</h3>
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded-md group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {routeMap?.routeStep?.results?.length || 0} Steps
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                            {isRouteMapExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>

                    {isRouteMapExpanded && routeMap?.routeStep?.results && (
                        <div className="relative mt-8 animate-in slide-in-from-top-4 duration-500">
                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 hidden md:block"></div>
                            <div className="flex flex-col md:flex-row justify-between relative gap-8 md:gap-4 overflow-x-auto pb-4 no-scrollbar">
                                {routeMap.routeStep.results.map((step, idx) => {
                                    const isCurrent = step.current;
                                    const isCompleted = step.completed;
                                    const subStep = step.routeSubStep?.results?.[0];
                                    const processorName = step.userFullName || subStep?.userFullName || step.userRole || subStep?.userRole || (isCompleted ? 'Completed' : 'TBD');

                                    return (
                                        <div key={idx} className="flex flex-col items-center text-center min-w-[140px] md:min-w-0 group">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-black mb-4 transition-all duration-300 relative ${isCurrent
                                                ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-110 border-4 border-white ring-2 ring-indigo-600'
                                                : (isCompleted ? 'bg-white text-indigo-600 border border-indigo-100 shadow-sm' : 'bg-white border border-slate-100 text-slate-300')
                                                }`}>
                                                {isCompleted ? <CheckCircle2 size={18} className="text-indigo-500" /> : idx + 1}
                                                {isCurrent && (
                                                    <span className="absolute -top-2 -right-2 flex h-4 w-4">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1.5 px-2">
                                                <p className={`text-[11px] font-black leading-tight break-keep max-w-[120px] mx-auto ${isCurrent ? 'text-indigo-600' : (isCompleted ? 'text-slate-800 font-bold' : 'text-slate-400')}`}>
                                                    {step.stepName}
                                                </p>
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold transition-all ${isCurrent
                                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-500 shadow-sm'
                                                    : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                    <Info size={10} className={isCurrent ? 'text-indigo-400' : 'text-slate-300'} />
                                                    <span className="truncate max-w-[80px]">{processorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 레이아웃 메인 */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* LNB */}
                <div className="w-full lg:w-80 shrink-0 space-y-1.5 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm h-fit sticky top-4 z-20">
                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Section List</p>
                    {sections.map(sec => (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSectionId(sec.id)}
                            className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-left transition-all group ${activeSectionId === sec.id
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <sec.icon size={18} className={activeSectionId === sec.id ? 'text-white' : 'text-slate-300 group-hover:text-indigo-400'} />
                                <span className="text-xs font-black tracking-tight leading-tight">{sec.title}</span>
                            </div>
                            <ChevronRight size={14} className={activeSectionId === sec.id ? 'opacity-100' : 'opacity-0'} />
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 w-full min-w-0">
                    {!activeSection && <div className="p-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Content...</div>}

                    {activeSection?.type === 'intro' && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Info size={20} /></div>
                                {activeSection.title}
                            </h3>
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                                {cleanHtml(activeSection.data.sectionDescription)}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'objective' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black text-slate-800">{activeSection.data.sectionName}</h3>
                                {activeSection.data.sectionWeight && (
                                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Weight: {activeSection.data.sectionWeight}%</span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {activeSection.data.objectives?.results?.length === 0 ? (
                                    <p className="p-20 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs font-bold">목표 항목이 없습니다.</p>
                                ) : (
                                    activeSection.data.objectives?.results?.map((obj, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:border-indigo-200 transition-all group">
                                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center px-6">
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">{idx + 1}</span>
                                                    <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-700">{obj.name}</h4>
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase bg-white px-2 py-1 rounded border border-slate-100">W: {obj.weight || 0}%</div>
                                            </div>
                                            <div className="p-6 bg-white space-y-6">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Metrics</p>
                                                    <div className="bg-slate-50/50 p-4 rounded-xl text-xs font-medium text-slate-600 border border-slate-50 italic">
                                                        {cleanHtml(obj.metric)}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                                    <div className="md:col-span-3">
                                                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block ml-1 mb-2">Self Rating</label>
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map(v => (
                                                                <button
                                                                    key={v}
                                                                    onClick={() => handleInputChange(`${activeSection.id}_${idx}`, 'rating', String(v))}
                                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${parseFloat(v) === parseFloat(inputs[`${activeSection.id}_${idx}`]?.rating || 0) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-200'}`}
                                                                >
                                                                    {v}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-9 relative">
                                                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block ml-1 mb-2">Self Comments</label>
                                                        <Quote size={24} className="absolute top-8 left-0 text-slate-100 -scale-x-100" />
                                                        <textarea
                                                            value={inputs[`${activeSection.id}_${idx}`]?.comment || ''}
                                                            onChange={(e) => handleInputChange(`${activeSection.id}_${idx}`, 'comment', e.target.value)}
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:ring-8 focus:ring-indigo-50 focus:border-indigo-200 transition-all min-h-[100px] shadow-sm relative z-10"
                                                            placeholder="목표 달성도를 자유롭게 서술해 주세요..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'competency' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black text-slate-800">{activeSection.data.sectionName}</h3>
                                {activeSection.data.sectionWeight && (
                                    <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Weight: {activeSection.data.sectionWeight}%</span>
                                )}
                            </div>
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
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-1">{comp.description}</p>
                                                </div>
                                                <div className="bg-purple-50 p-4 rounded-3xl border border-purple-100 min-w-[140px]">
                                                    <p className="text-[10px] text-purple-400 font-black uppercase mb-3 tracking-widest text-center">Self Rating</p>
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
                                            <div className="mt-8 pt-8 border-t border-slate-50 relative">
                                                <Quote size={32} className="absolute -top-4 left-0 text-slate-100 -scale-x-100" />
                                                <textarea
                                                    value={inputs[`${activeSection.id}_${comp.itemId}`]?.comment || ''}
                                                    onChange={(e) => handleInputChange(`${activeSection.id}_${comp.itemId}`, 'comment', e.target.value)}
                                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-8 focus:ring-purple-50 focus:border-purple-200 transition-all min-h-[120px] shadow-inner relative z-10"
                                                    placeholder="역량 발현 사례를 작성해 주세요..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'summary' && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-100"><MessageSquare size={28} /></div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">{activeSection.title}</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Overall Assessment</p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm min-w-[200px]">
                                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-3 tracking-widest">Overall Form Rating</p>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map(v => {
                                            const currentRating = inputs['summary']?.rating ? Math.round(parseFloat(inputs['summary'].rating)) : 0;
                                            return (
                                                <button
                                                    key={v}
                                                    onClick={() => handleInputChange('summary', 'rating', String(v))}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all ${v <= Math.round(parseFloat(inputs['summary']?.rating || 0)) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-200'}`}
                                                >
                                                    {v}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block ml-1">Overall Comments</label>
                                <textarea
                                    value={inputs['summary']?.comment || ''}
                                    onChange={(e) => handleInputChange('summary', 'comment', e.target.value)}
                                    className="w-full h-80 bg-slate-50 border border-slate-100 rounded-3xl p-8 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-[1rem] focus:ring-indigo-50/50 focus:border-indigo-200 transition-all shadow-inner"
                                    placeholder="당신의 이번 해는 어떤 영향력을 미쳤나요? 성숙해진 점과 보완할 점을 자유롭게 작성해 주세요."
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PMDetailView;
