/**
 * Project: react-sfsf-viewer
 * File: /src/components/360MultiRaterDetailView.jsx
 * Description: 360 다면평가(Multi-Rater) 전용 상세 뷰 컴포넌트 (임시저장 기능 추가)
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
                const [data, routeData, user] = await Promise.all([
                    sfService.getForm360Detail(form.formContentId, form.formDataId),
                    sfService.getFormRouteMap(form.formDataId),
                    sfService.getCurrentUser()
                ]);

                setDetail(data);
                setRouteMap(routeData);

                const dynamicSections = [];
                const initialInputs = {};
                const content = data;
                const currentUserId = user?.userId;

                // Helper: 현재 사용자가 작성 가능한 Rating/Comment 키 찾기
                const findUserRating = (item) => {
                    // 1. 본인 평가(Self) 먼저 확인
                    if (item.selfRatingComment?.ratingKey || item.selfRatingComment?.commentKey) {
                        return { ...item.selfRatingComment, type: 'self' };
                    }
                    // 2. 타인 평가(Others) 목록에서 본인 것에 해당하는지(권한 기준) 확인
                    const others = item.othersRatingComment?.results || [];
                    const myRating = others.find(r => r.ratingKey || r.commentKey);
                    if (myRating) {
                        return { ...myRating, type: 'others' };
                    }
                    return null;
                };

                // 1. User Info
                if (content.userInformationSection) {
                    dynamicSections.push({
                        id: 'user_info',
                        title: content.userInformationSection.sectionName || 'Employee Information',
                        type: 'user_info',
                        data: content.userInformationSection,
                        icon: User
                    });
                }

                // 2. Intro
                if (content.introductionSection) {
                    dynamicSections.push({
                        id: 'intro',
                        title: content.introductionSection.sectionName || 'Introduction',
                        type: 'intro',
                        data: content.introductionSection,
                        icon: Info
                    });
                }

                // 3. Objectives
                (content.objectiveSections?.results || []).forEach((sec, sidx) => {
                    const sId = `obj_${sidx}`;
                    dynamicSections.push({
                        id: sId,
                        title: sec.sectionName || 'Objectives',
                        type: 'objective',
                        data: sec,
                        icon: Target
                    });

                    sec.objectives?.results?.forEach((obj) => {
                        const key = `${sId}_${obj.itemId}`;
                        const r = findUserRating(obj);
                        initialInputs[key] = {
                            itemId: obj.itemId,
                            sectionIndex: sec.sectionIndex,
                            rating: r?.rating ? String(parseFloat(r.rating)) : '',
                            comment: r?.comment || '',
                            ratingKey: r?.ratingKey,
                            commentKey: r?.commentKey,
                            ratingType: r?.type || 'na',
                            userId: r?.userId || '',
                            ratingPermission: r?.ratingPermission || 'read',
                            commentPermission: r?.commentPermission || 'read'
                        };
                    });
                });

                // 4. Competencies (Merged with Skills)
                const rawCompSections = content.competencySections?.results || [];
                const rawCustomSections = content.customSections?.results || [];
                const extractedSkills = rawCustomSections
                    .filter(sec => sec.attributeType === 'SKILL')
                    .map(sec => ({
                        ...sec,
                        competencies: { results: sec.customItems?.results || [] }
                    }));

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
                        const r = findUserRating(comp);
                        initialInputs[key] = {
                            itemId: comp.itemId,
                            sectionIndex: sec.sectionIndex,
                            rating: r?.rating ? String(parseFloat(r.rating)) : '',
                            comment: r?.comment || '',
                            ratingKey: r?.ratingKey,
                            commentKey: r?.commentKey,
                            ratingType: r?.type || 'na',
                            userId: r?.userId || '',
                            ratingPermission: r?.ratingPermission || 'read',
                            commentPermission: r?.commentPermission || 'read'
                        };
                    });
                });

                // 5. Custom Sections
                rawCustomSections.filter(sec => sec.attributeType !== 'SKILL').forEach((sec, idx) => {
                    const sId = `custom_${idx}`;
                    let icon = Brain;
                    if (sec.attributeType === 'STRENGTH') icon = Zap;
                    if (sec.attributeType === 'DEVELOPMENT') icon = TrendingUp;

                    dynamicSections.push({
                        id: sId,
                        title: sec.sectionName,
                        type: 'custom',
                        data: sec,
                        icon: icon
                    });

                    sec.customItems?.results?.forEach((item) => {
                        const key = `${sId}_${item.itemId}`;
                        const r = findUserRating(item);
                        initialInputs[key] = {
                            itemId: item.itemId,
                            sectionIndex: sec.sectionIndex,
                            rating: r?.rating ? String(parseFloat(r.rating)) : '',
                            comment: r?.comment || '',
                            ratingKey: r?.ratingKey,
                            commentKey: r?.commentKey,
                            ratingType: r?.type || 'na',
                            userId: r?.userId || '',
                            ratingPermission: r?.ratingPermission || 'read',
                            commentPermission: r?.commentPermission || 'read'
                        };
                    });
                });

                // 6. Summary
                if (content.summarySection) {
                    const summary = content.summarySection;
                    dynamicSections.push({
                        id: 'summary',
                        title: summary.sectionName || 'Overall Average Rating',
                        type: 'summary',
                        data: summary,
                        icon: Star
                    });
                    const r = findUserRating(summary) || summary.selfRatingComment;
                    initialInputs['summary'] = {
                        sectionIndex: summary.sectionIndex,
                        rating: (summary.overallFormRating?.rating || r?.rating) ? String(parseFloat(summary.overallFormRating?.rating || r?.rating)) : '',
                        comment: r?.comment || '',
                        ratingKey: summary.overallFormRating?.ratingKey || r?.ratingKey,
                        commentKey: r?.commentKey,
                        ratingType: 'overall',
                        userId: r?.userId || '',
                        ratingPermission: 'write',
                        commentPermission: 'write'
                    };
                }

                // 7. Raters
                if (content.form360RaterSection) {
                    dynamicSections.push({
                        id: 'raters',
                        title: content.form360RaterSection.sectionName || 'Rater List',
                        type: '360_raters',
                        data: content.form360RaterSection,
                        icon: Users
                    });
                }

                // 8. Summary View
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
                if (dynamicSections.length > 0) setActiveSectionId(dynamicSections[0].id);
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
        try {
            setIsSaving(true);
            const content = detail;
            if (!content) return;

            const rootPayload = {
                "__metadata": {
                    "uri": `Form360ReviewContentDetail(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L)`,
                    "type": "SFOData.Form360ReviewContentDetail"
                },
                "formContentId": String(form.formContentId),
                "formDataId": String(form.formDataId)
            };

            // Objectives
            const objectiveSections = [];
            (content.objectiveSections?.results || []).forEach((sec, sidx) => {
                const sId = `obj_${sidx}`;
                const objectives = [];
                sec.objectives?.results?.forEach((obj) => {
                    const key = `${sId}_${obj.itemId}`;
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
                                    "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${obj.itemId}L,ratingType='${input.ratingType}',sectionIndex=${sec.sectionIndex},userId='${input.userId}')`,
                                    "type": "SFOData.FormUserRatingComment"
                                },
                                "rating": input.rating ? parseFloat(input.rating).toFixed(1) : (obj.selfRatingComment?.rating || null),
                                "comment": input.comment,
                                "ratingKey": input.ratingKey || obj.selfRatingComment?.ratingKey,
                                "commentKey": input.commentKey || obj.selfRatingComment?.commentKey
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

            // Competencies
            const competencySections = [];
            const rawCompSections = content.competencySections?.results || [];
            const rawCustomSections = content.customSections?.results || [];
            const extractedSkills = rawCustomSections
                .filter(sec => sec.attributeType === 'SKILL')
                .map(sec => ({
                    ...sec,
                    competencies: { results: sec.customItems?.results || [] }
                }));

            const mergedCompSections = [...rawCompSections, ...extractedSkills];
            mergedCompSections.forEach((sec, sidx) => {
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
                                    "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${comp.itemId}L,ratingType='${input.ratingType}',sectionIndex=${sec.sectionIndex},userId='${input.userId}')`,
                                    "type": "SFOData.FormUserRatingComment"
                                },
                                "rating": input.rating ? parseFloat(input.rating).toFixed(1) : (comp.selfRatingComment?.rating || null),
                                "comment": input.comment,
                                "ratingKey": input.ratingKey || comp.selfRatingComment?.ratingKey,
                                "commentKey": input.commentKey || comp.selfRatingComment?.commentKey
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

            // Custom Sections
            const customSections = [];
            rawCustomSections.filter(sec => sec.attributeType !== 'SKILL').forEach((sec, sidx) => {
                const sId = `custom_${sidx}`;
                const customItems = [];
                sec.customItems?.results?.forEach((item) => {
                    const key = `${sId}_${item.itemId}`;
                    const input = inputs[key];
                    if (input) {
                        customItems.push({
                            "__metadata": {
                                "uri": `FormCustomItem(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${item.itemId}L,sectionIndex=${sec.sectionIndex})`,
                                "type": "SFOData.FormCustomItem"
                            },
                            "itemId": String(item.itemId),
                            "selfRatingComment": {
                                "__metadata": {
                                    "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${item.itemId}L,ratingType='${input.ratingType}',sectionIndex=${sec.sectionIndex},userId='${input.userId}')`,
                                    "type": "SFOData.FormUserRatingComment"
                                },
                                "rating": input.rating ? parseFloat(input.rating).toFixed(1) : (item.selfRatingComment?.rating || null),
                                "comment": input.comment,
                                "ratingKey": input.ratingKey || item.selfRatingComment?.ratingKey,
                                "commentKey": input.commentKey || item.selfRatingComment?.commentKey
                            }
                        });
                    }
                });
                if (customItems.length > 0) {
                    customSections.push({
                        "__metadata": {
                            "uri": `FormCustomSection(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,sectionIndex=${sec.sectionIndex})`,
                            "type": "SFOData.FormCustomSection"
                        },
                        "customItems": customItems
                    });
                }
            });

            if (objectiveSections.length > 0) rootPayload.objectiveSections = objectiveSections;
            if (competencySections.length > 0) rootPayload.competencySections = competencySections;
            if (customSections.length > 0) rootPayload.customSections = customSections;

            // Summary
            const summary = content.summarySection;
            const sInput = inputs['summary'];
            if (summary && sInput) {
                rootPayload.summarySection = {
                    "__metadata": {
                        "uri": `FormSummarySection(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L)`,
                        "type": "SFOData.FormSummarySection"
                    },
                    "overallFormRating": {
                        "__metadata": {
                            "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=0L,ratingType='overall',sectionIndex=${summary.sectionIndex},userId='${sInput.userId}')`,
                            "type": "SFOData.FormUserRatingComment"
                        },
                        "rating": sInput.rating ? parseFloat(sInput.rating).toFixed(1) : (summary.overallFormRating?.rating || null),
                        "comment": sInput.comment,
                        "ratingKey": sInput.ratingKey || summary.overallFormRating?.ratingKey,
                        "commentKey": sInput.commentKey || summary.overallFormRating?.commentKey
                    }
                };
            }

            await sfService.updateFormRating(rootPayload);
            alert(t('common.saveSuccess'));
        } catch (error) {
            console.error('Failed to save 360 form', error);
            alert(t('common.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!window.confirm(t('common.confirmSubmit360'))) return;
        try {
            setIsSubmitting(true);
            await handleSave();
            const result = await sfService.complete360(form.formDataId);
            if (result === 'Success' || result?.status === 'Success' || result?.d?.status === 'Success') {
                alert(t('common.submitSuccess'));
                onBack();
            } else {
                throw new Error(result?.status || 'Unknown error');
            }
        } catch (error) {
            console.error('Failed to complete 360 form', error);
            alert(t('common.submitError'));
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
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
            </div>
        );
    }

    const activeSection = sections.find(s => s.id === activeSectionId);

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-20">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 bg-[#f8fafc]/80 backdrop-blur-md py-2">
                <button onClick={onBack} className="group px-4 py-2 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 hover:bg-slate-50 shadow-sm w-fit transition-all">
                    <ChevronLeft size={16} className="text-slate-400 group-hover:text-purple-600" />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{t('common.back')}</span>
                </button>
                <div className="flex gap-2">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:border-purple-600 hover:text-purple-600 transition-all shadow-sm">
                        {isSaving ? <div className="w-4 h-4 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin"></div> : <Save size={16} />}
                        <span>{t('common.save')}</span>
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting || isSaving} className="px-6 py-2.5 bg-purple-600 text-white rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-purple-700 shadow-xl shadow-purple-100 transition-all transform active:scale-95">
                        {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={16} />}
                        <span>{t('common.submit')}</span>
                    </button>
                </div>
            </div>

            {/* Form Info Card */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">
                            <Clock size={12} /> 360 MULTI-RATER
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{detail?.formTitle || form.formTitle}</h2>
                        <div className="flex flex-wrap gap-4 text-slate-500 text-xs font-bold">
                            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><User size={14} /> {detail?.subjectUserName || detail?.subjectUserId}</span>
                        </div>
                    </div>
                </div>
                <RouteMapStepView routeMap={routeMap} color="purple" title="Process Timeline" />
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-72 shrink-0 space-y-1.5 bg-white p-4 rounded-3xl border border-slate-200 h-fit sticky top-24 z-20 shadow-sm">
                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sections</p>
                    {sections.map(sec => (
                        <button key={sec.id} onClick={() => setActiveSectionId(sec.id)} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all ${activeSectionId === sec.id ? 'bg-purple-600 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                                <sec.icon size={18} />
                                <span className="text-[11px] font-black tracking-tight">{sec.title}</span>
                            </div>
                            <ChevronRight size={14} className={activeSectionId === sec.id ? 'opacity-100' : 'opacity-0'} />
                        </button>
                    ))}
                </div>

                <div className="flex-1 w-full min-w-0">
                    {activeSection?.type === 'user_info' && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in">
                            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><User size={20} /></div> {activeSection.title}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: 'Name', value: detail.subjectUser?.displayName },
                                    { label: 'Title', value: detail.subjectUser?.title },
                                    { label: 'Department', value: detail.subjectUser?.department },
                                    { label: 'Hire Date', value: detail.subjectUser?.hireDate ? new Date(parseInt(detail.subjectUser.hireDate.match(/\d+/)[0])).toLocaleDateString() : 'N/A' }
                                ].map((item, i) => (
                                    <div key={i} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                        <span className="text-xs font-bold text-slate-700">{item.value || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'intro' && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in">
                            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Info size={20} /></div> {activeSection.title}
                            </h3>
                            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: activeSection.data.sectionDescription }} />
                        </div>
                    )}

                    {(activeSection?.type === 'objective' || activeSection?.type === 'competency' || activeSection?.type === 'custom') && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-800 px-2">{activeSection.title}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {(activeSection.type === 'objective' ? activeSection.data.objectives?.results :
                                    activeSection.type === 'competency' ? activeSection.data.competencies?.results :
                                        activeSection.data.customItems?.results)?.map((item, idx) => {
                                            const key = `${activeSection.id}_${item.itemId}`;
                                            const input = inputs[key];
                                            return (
                                                <div key={idx} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 hover:border-purple-100 transition-all">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</div>
                                                            <div className="space-y-1">
                                                                <h4 className="text-lg font-black text-slate-900">{item.name}</h4>
                                                                <div className="text-xs text-slate-500 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: item.metric || item.description }} />
                                                            </div>
                                                        </div>
                                                        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 min-w-[140px] shrink-0">
                                                            <p className="text-[10px] text-purple-400 font-black uppercase mb-3 tracking-widest text-center">Rating</p>
                                                            <div className="flex gap-1 justify-center">
                                                                {[1, 2, 3, 4, 5].map(v => (
                                                                    <button
                                                                        key={v}
                                                                        onClick={() => handleInputChange(key, 'rating', String(v))}
                                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${parseFloat(v) === parseFloat(input?.rating || 0) ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-300'}`}
                                                                    >
                                                                        {v}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1 mb-2">Comments</label>
                                                        <textarea
                                                            value={input?.comment || ''}
                                                            onChange={(e) => handleInputChange(key, 'comment', e.target.value)}
                                                            className="w-full bg-slate-50/10 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all min-h-[100px]"
                                                            placeholder="의견을 입력해주세요..."
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                {!activeSection.data.customItems?.results && activeSection.type === 'custom' && (
                                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                        <textarea
                                            value={inputs[activeSection.id]?.comment || ''}
                                            onChange={(e) => handleInputChange(activeSection.id, 'comment', e.target.value)}
                                            className="w-full bg-slate-50/10 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all min-h-[150px]"
                                            placeholder="종합 의견을 입력해주세요..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'summary' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-800 px-2">{activeSection.title}</h3>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-4 flex flex-col items-center justify-center bg-purple-50/30 rounded-3xl p-6 border border-purple-100">
                                        <Star size={32} className="text-purple-600 mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Final Rating</p>
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <button key={v} onClick={() => handleInputChange('summary', 'rating', String(v))} className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black border transition-all ${parseFloat(v) === parseFloat(inputs.summary?.rating || 0) ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-200'}`}>{v}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="md:col-span-8">
                                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1 mb-2">Final Comments</label>
                                        <textarea
                                            value={inputs.summary?.comment || ''}
                                            onChange={(e) => handleInputChange('summary', 'comment', e.target.value)}
                                            className="w-full bg-slate-50/10 border border-slate-100 rounded-3xl px-6 py-5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all min-h-[200px]"
                                            placeholder="종합 의견을 작성해주세요..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection?.type === '360_raters' && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in">
                            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Users size={20} /></div> {activeSection.title}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeSection.data.form360Raters?.results?.map((rater, ridx) => (
                                    <div key={ridx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black">{rater.participantFullName?.charAt(0)}</div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-700">{rater.participantFullName}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{rater.category}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${rater.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{rater.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === '360_summary_view' && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in">
                            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><BarChart3 size={20} /></div> {activeSection.title}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeSection.data.formRaters?.results?.map((rater, ridx) => (
                                    <div key={ridx} className="bg-slate-50/30 p-6 rounded-3xl border border-slate-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{rater.raterCategory}</span>
                                            <span className="text-xl font-black text-slate-900">{parseFloat(rater.rating || 0).toFixed(1)}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(parseFloat(rater.rating || 0) / 5) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default _360MultiRaterDetailView;
