/**
 * Project: react-sfsf-viewer
 * File: /src/components/PMDetailView.jsx
 * Description: 업무 시스템 느낌의 성과평가(PM v12) 상세 뷰 컴포넌트
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, Target, Award, Info,
    Save, Clock, Send,
    Star, Layout, Users, UserCheck, MessageCircle
} from 'lucide-react';
import { sfService } from '../services/sfService';
import RouteMapStepView from './RouteMapStepView';

const PMDetailView = ({ form, onBack }) => {
    const { t } = useTranslation();
    const [detail, setDetail] = useState(null);
    const [routeMap, setRouteMap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState([]);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [inputs, setInputs] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subjectPhoto, setSubjectPhoto] = useState(null);

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

                // 피평가자 사진 가져오기
                const photo = await sfService.getUserPhoto(data.formHeader?.formSubjectId);
                setSubjectPhoto(photo);

                const pmContent = data?.pmReviewContentDetail?.results?.[0];
                const dynamicSections = [];
                const initialInputs = {};

                if (pmContent) {
                    // 1. Introduction
                    if (pmContent.introductionSection) {
                        dynamicSections.push({
                            id: 'intro',
                            title: pmContent.introductionSection.sectionName || 'Introduction',
                            type: 'intro',
                            data: pmContent.introductionSection,
                            icon: Info
                        });
                    }

                    // 2. Objectives
                    (pmContent.objectiveSections?.results || []).forEach((sec, sidx) => {
                        const sId = `obj_${sidx}`;
                        dynamicSections.push({
                            id: sId,
                            title: sec.sectionName,
                            type: 'objective',
                            data: sec,
                            icon: Target
                        });

                        sec.objectives?.results?.forEach((obj) => {
                            const key = `${sId}_${obj.itemId}`;
                            const self = obj.selfRatingComment;
                            const official = obj.officialRating;
                            const others = obj.othersRatingComment?.results || [];

                            initialInputs[key] = {
                                selfRating: self?.rating ? String(parseFloat(self.rating)) : '',
                                selfComment: self?.comment || '',
                                rating: official?.rating ? String(parseFloat(official.rating)) : '',
                                comment: official?.comment || '',
                                ratingKey: official?.ratingKey,
                                commentKey: official?.commentKey,
                                ratingPermission: official?.ratingPermission || 'none',
                                commentPermission: official?.commentPermission || 'none',
                                others: others
                            };
                        });
                    });

                    // 3. Competencies
                    (pmContent.competencySections?.results || []).forEach((sec, sidx) => {
                        const sId = `comp_${sidx}`;
                        dynamicSections.push({
                            id: sId,
                            title: sec.sectionName,
                            type: 'competency',
                            data: sec,
                            icon: Award
                        });

                        sec.competencies?.results?.forEach((comp) => {
                            const key = `${sId}_${comp.itemId}`;
                            const self = comp.selfRatingComment;
                            const official = comp.officialRating;
                            const others = comp.othersRatingComment?.results || [];

                            initialInputs[key] = {
                                selfRating: self?.rating ? String(parseFloat(self.rating)) : '',
                                selfComment: self?.comment || '',
                                rating: official?.rating ? String(parseFloat(official.rating)) : '',
                                comment: official?.comment || '',
                                ratingKey: official?.ratingKey,
                                commentKey: official?.commentKey,
                                ratingPermission: official?.ratingPermission || 'none',
                                commentPermission: official?.commentPermission || 'none',
                                others: others
                            };
                        });
                    });

                    // 4. Summary
                    if (pmContent.summarySection) {
                        const summary = pmContent.summarySection;
                        const self = summary.selfRatingComment;
                        const official = summary.overallFormRating;
                        const others = summary.othersRatingComment?.results || [];

                        dynamicSections.push({
                            id: 'summary',
                            title: summary.sectionName || 'Overall Result',
                            type: 'summary',
                            data: summary,
                            icon: Star
                        });
                        initialInputs['summary'] = {
                            selfRating: self?.rating ? String(parseFloat(self.rating)) : '',
                            selfComment: self?.comment || '',
                            rating: official?.rating ? String(parseFloat(official.rating)) : '',
                            comment: official?.comment || '',
                            ratingKey: official?.ratingKey,
                            commentKey: official?.commentKey,
                            ratingPermission: official?.ratingPermission || 'none',
                            commentPermission: official?.commentPermission || 'none',
                            others: others
                        };
                    }
                }

                setSections(dynamicSections);
                setInputs(initialInputs);
                if (dynamicSections.length > 0) setActiveSectionId(dynamicSections[0].id);
            } catch (error) {
                console.error('Failed to load PM form detail', error);
            } finally {
                setLoading(false);
            }
        };

        if (form) fetchDetail();
    }, [form]);

    const handleInputChange = (key, field, value) => {
        const permissionField = field === 'rating' ? 'ratingPermission' : 'commentPermission';
        if (inputs[key][permissionField] === 'none') return;

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

            const rootPayload = {
                "__metadata": {
                    "uri": `FormPMReviewContentDetail(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L)`,
                    "type": "SFOData.FormPMReviewContentDetail"
                },
                "formContentId": String(form.formContentId),
                "formDataId": String(form.formDataId)
            };

            // Objectives
            const objectiveSections = [];
            (pmContent.objectiveSections?.results || []).forEach((sec, sidx) => {
                const sId = `obj_${sidx}`;
                const objectives = [];
                sec.objectives?.results?.forEach((obj) => {
                    const key = `${sId}_${obj.itemId}`;
                    const input = inputs[key];
                    if (input && (input.ratingPermission === 'write' || input.commentPermission === 'write')) {
                        objectives.push({
                            "__metadata": {
                                "uri": `FormObjective(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${obj.itemId}L,sectionIndex=${sec.sectionIndex})`,
                                "type": "SFOData.FormObjective"
                            },
                            "itemId": String(obj.itemId),
                            "officialRating": {
                                "__metadata": {
                                    "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${obj.itemId}L,ratingType='na',sectionIndex=${sec.sectionIndex},userId='')`,
                                    "type": "SFOData.FormUserRatingComment"
                                },
                                "rating": input.rating ? parseFloat(input.rating).toFixed(1) : (obj.officialRating?.rating || null),
                                "comment": input.comment,
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

            // Competencies
            const competencySections = [];
            (pmContent.competencySections?.results || []).forEach((sec, sidx) => {
                const sId = `comp_${sidx}`;
                const competencies = [];
                sec.competencies?.results?.forEach((comp) => {
                    const key = `${sId}_${comp.itemId}`;
                    const input = inputs[key];
                    if (input && (input.ratingPermission === 'write' || input.commentPermission === 'write')) {
                        competencies.push({
                            "__metadata": {
                                "uri": `FormCompetency(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${comp.itemId}L,sectionIndex=${sec.sectionIndex})`,
                                "type": "SFOData.FormCompetency"
                            },
                            "itemId": String(comp.itemId),
                            "officialRating": {
                                "__metadata": {
                                    "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${comp.itemId}L,ratingType='na',sectionIndex=${sec.sectionIndex},userId='')`,
                                    "type": "SFOData.FormUserRatingComment"
                                },
                                "rating": input.rating ? parseFloat(input.rating).toFixed(1) : (comp.officialRating?.rating || null),
                                "comment": input.comment,
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

            // Summary
            const summary = pmContent.summarySection;
            const sInput = inputs['summary'];
            if (summary && sInput && (sInput.ratingPermission === 'write' || sInput.commentPermission === 'write')) {
                rootPayload.summarySection = {
                    "__metadata": {
                        "uri": `FormSummarySection(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L)`,
                        "type": "SFOData.FormSummarySection"
                    },
                    "overallFormRating": {
                        "__metadata": {
                            "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=0L,ratingType='overall',sectionIndex=${summary.sectionIndex},userId='')`,
                            "type": "SFOData.FormUserRatingComment"
                        },
                        "rating": sInput.rating ? parseFloat(sInput.rating).toFixed(1) : (summary.overallFormRating?.rating || null),
                        "comment": sInput.comment,
                        "ratingKey": sInput.ratingKey,
                        "commentKey": sInput.commentKey
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

    const handleSubmit = async () => {
        if (!window.confirm(t('common.confirmSubmit'))) return;
        try {
            setIsSubmitting(true);
            await handleSave();
            const result = await sfService.sendToNextStep(form.formDataId);
            if (result === 'Success' || result?.status === 'Success' || result?.d?.status === 'Success') {
                alert(t('common.submitSuccess'));
                onBack();
            } else {
                throw new Error(result?.status || 'Unknown error');
            }
        } catch (error) {
            console.error('Failed to submit PM form', error);
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
                <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-400">{t('common.loading')}</p>
            </div>
        );
    }

    const activeSection = sections.find(s => s.id === activeSectionId);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Sticky Header with Timeline and Actions */}
            <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
                {/* Top Action Bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
                    <button onClick={onBack} className="group flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-all">
                        <ChevronLeft size={16} className="text-slate-400 group-hover:text-indigo-600" />
                        <span className="text-xs font-bold text-slate-600">{t('common.back')}</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold">
                            <Clock size={12} /> {detail?.formHeader?.formDataStatus || 'IN PROGRESS'}
                        </div>
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md flex items-center gap-1.5 font-bold text-xs hover:border-indigo-600 hover:text-indigo-600 transition-all">
                            {isSaving ? <div className="w-3.5 h-3.5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div> : <Save size={14} />}
                            <span>{t('common.save')}</span>
                        </button>
                        <button onClick={handleSubmit} disabled={isSubmitting || isSaving} className="px-4 py-1.5 bg-indigo-600 text-white rounded-md flex items-center gap-1.5 font-bold text-xs hover:bg-indigo-700 transition-all">
                            {isSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={14} />}
                            <span>{t('common.submit')}</span>
                        </button>
                    </div>
                </div>

                {/* Form Info and Timeline */}
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{form.formTitle}</h2>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5"><Users size={12} /> {detail?.formHeader?.formSubjectId}</span>
                                <span className="flex items-center gap-1.5"><Layout size={12} /> {t('pm.type.v12')}</span>
                            </div>
                        </div>
                    </div>
                    <RouteMapStepView routeMap={routeMap} color="indigo" title="Process Timeline" />
                </div>

                {/* Section Tabs */}
                <div className="px-6 overflow-x-auto">
                    <div className="flex items-center gap-1 min-w-max">
                        {sections.map(sec => (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSectionId(sec.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                                    activeSectionId === sec.id
                                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <sec.icon size={14} />
                                <span>{sec.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area - Full Width */}
            <div className="px-6 py-6">
                {activeSection?.type === 'intro' && (
                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                        <div className="bg-slate-50 p-5 rounded-md border border-slate-100 text-sm text-slate-700 leading-relaxed">
                            {cleanHtml(activeSection.data.sectionDescription)}
                        </div>
                    </div>
                )}

                {(activeSection?.type === 'objective' || activeSection?.type === 'competency') && (
                    <div className="space-y-3">
                        {(activeSection.type === 'objective' ? activeSection.data.objectives?.results : activeSection.data.competencies?.results)?.map((item, idx) => {
                            const key = `${activeSection.id}_${item.itemId}`;
                            const input = inputs[key];
                            return (
                                <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all">
                                    {/* Item Header - Compact */}
                                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${activeSection.type === 'objective' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-1">{cleanHtml(item.metric || item.description)}</p>
                                        </div>
                                    </div>

                                    {/* Feedback Grid - Compact Side by Side */}
                                    <div className="p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Self Feedback - Read Only */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {subjectPhoto ? (
                                                            <img src={subjectPhoto} alt="Self" className="w-6 h-6 rounded-full border border-slate-200" />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                                <Users size={12} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                        <span className="text-xs font-bold text-slate-600">Self Feedback</span>
                                                    </div>
                                                    {input?.selfRating && (
                                                        <div className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold">
                                                            {input.selfRating}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="bg-slate-50 border border-slate-100 rounded-md p-3 text-xs text-slate-600 min-h-[80px]">
                                                    {input?.selfComment || <span className="text-slate-400 italic">No comment</span>}
                                                </div>
                                            </div>

                                            {/* Official Review - Editable */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <UserCheck size={12} className="text-indigo-600" />
                                                        </div>
                                                        <span className="text-xs font-bold text-indigo-600">Official Review</span>
                                                    </div>
                                                    {input?.ratingPermission !== 'none' && (
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map(v => (
                                                                <button
                                                                    key={v}
                                                                    onClick={() => handleInputChange(key, 'rating', String(v))}
                                                                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${
                                                                        parseFloat(v) === parseFloat(input?.rating)
                                                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                            : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-300'
                                                                    }`}
                                                                >
                                                                    {v}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {input?.commentPermission !== 'none' ? (
                                                    <textarea
                                                        value={input?.comment || ''}
                                                        onChange={(e) => handleInputChange(key, 'comment', e.target.value)}
                                                        className="w-full bg-white border border-indigo-100 rounded-md px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 transition-all min-h-[80px]"
                                                        placeholder="Enter your review..."
                                                    />
                                                ) : (
                                                    <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3 text-xs text-slate-600 min-h-[80px]">
                                                        {input?.comment || <span className="text-slate-400 italic">No comment</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Other Evaluators - Collapsible */}
                                        {input?.others?.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MessageCircle size={12} className="text-amber-600" />
                                                    <span className="text-xs font-bold text-slate-600">Other Evaluators ({input.others.length})</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {input.others.map((other, oidx) => (
                                                        <div key={oidx} className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-md">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <div className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-[8px] font-bold">
                                                                    {other.firstName?.charAt(0) || 'O'}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-700">{other.fullName}</span>
                                                                <span className="ml-auto px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded text-[9px] font-bold">
                                                                    {other.rating}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2">
                                                                {other.comment || 'No comment'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeSection?.type === 'summary' && (
                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Self Summary */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {subjectPhoto ? (
                                            <img src={subjectPhoto} alt="Self" className="w-7 h-7 rounded-full border border-slate-200" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Users size={14} className="text-slate-400" />
                                            </div>
                                        )}
                                        <span className="text-sm font-bold text-slate-700">Self Summary</span>
                                    </div>
                                    {inputs.summary?.selfRating && (
                                        <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-bold">
                                            {inputs.summary.selfRating}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-md p-4 text-sm text-slate-600 min-h-[120px]">
                                    {inputs.summary?.selfComment || <span className="text-slate-400 italic">No summary provided</span>}
                                </div>
                            </div>

                            {/* Official Final Result */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <Star size={14} className="text-indigo-600" />
                                        </div>
                                        <span className="text-sm font-bold text-indigo-600">Official Final Result</span>
                                    </div>
                                    {inputs.summary?.ratingPermission !== 'none' && (
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => handleInputChange('summary', 'rating', String(v))}
                                                    className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold border transition-all ${
                                                        parseFloat(v) === parseFloat(inputs.summary?.rating)
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                            : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-300'
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {inputs.summary?.commentPermission !== 'none' ? (
                                    <textarea
                                        value={inputs.summary?.comment || ''}
                                        onChange={(e) => handleInputChange('summary', 'comment', e.target.value)}
                                        className="w-full bg-white border border-indigo-100 rounded-md px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 transition-all min-h-[120px]"
                                        placeholder="Enter final evaluation summary..."
                                    />
                                ) : (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 text-sm text-slate-600 min-h-[120px]">
                                        {inputs.summary?.comment || <span className="text-slate-400 italic">No summary provided</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PMDetailView;
