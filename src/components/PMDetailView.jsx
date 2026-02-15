/**
 * Project: react-sfsf-viewer
 * File: /src/components/PMDetailView.jsx
 * Description: 매니저 평가 기능이 강화된 성과평가(PM v12) 상세 뷰 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, Target, Award, MessageSquare, Info,
    Save, Clock, FileText, ChevronRight, Quote, Send,
    Brain, Zap, TrendingUp, Star, Layout, Users, UserCheck, MessageCircle
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

    const FeedbackCard = ({ title, rating, comment, icon: Icon, avatar, color, isEditable, onRatingChange, onCommentChange, permission = 'none' }) => (
        <div className={`p-6 rounded-[2rem] border ${color === 'blue' ? 'border-blue-100 bg-blue-50/10' : 'border-slate-100 bg-slate-50/30'} space-y-4 transition-all`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    {avatar ? (
                        <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-white">
                            <img src={avatar} alt={title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon size={16} />
                        </div>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</span>
                </div>
                {rating !== undefined && (
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(v => (
                            <button
                                key={v}
                                disabled={!isEditable || (isEditable && permission === 'none')}
                                onClick={() => onRatingChange?.(String(v))}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${parseFloat(v) === parseFloat(rating) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-200'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {isEditable && permission !== 'none' ? (
                <textarea
                    value={comment || ''}
                    onChange={(e) => onCommentChange?.(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all min-h-[90px]"
                    placeholder={`${title} 의견을 입력해주세요...`}
                />
            ) : (
                <div className="text-xs text-slate-600 font-medium leading-relaxed bg-white/60 p-4 rounded-2xl border border-white">
                    {comment || <span className="text-slate-300 italic">No feedback provided.</span>}
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
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
                    <ChevronLeft size={16} className="text-slate-400 group-hover:text-indigo-600" />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{t('common.back')}</span>
                </button>
                <div className="flex gap-2">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">
                        {isSaving ? <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div> : <Save size={16} />}
                        <span>{t('common.save')}</span>
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting || isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform active:scale-95">
                        {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={16} />}
                        <span>{t('common.submit')}</span>
                    </button>
                </div>
            </div>

            {/* Form Info Card */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            <Clock size={12} /> {detail?.formHeader?.formDataStatus || 'IN PROGRESS'}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{form.formTitle}</h2>
                        <div className="flex flex-wrap gap-4 text-slate-500 text-xs font-bold">
                            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Users size={14} /> {detail?.formHeader?.formSubjectId}</span>
                            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Layout size={14} /> {t('pm.type.v12')}</span>
                        </div>
                    </div>
                </div>
                <RouteMapStepView routeMap={routeMap} color="indigo" title="Process Timeline" />
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* LNB */}
                <div className="w-full lg:w-72 shrink-0 space-y-1.5 bg-white p-4 rounded-3xl border border-slate-200 h-fit sticky top-24 z-20 shadow-sm">
                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sections</p>
                    {sections.map(sec => (
                        <button key={sec.id} onClick={() => setActiveSectionId(sec.id)} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all ${activeSectionId === sec.id ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                                <sec.icon size={18} />
                                <span className="text-[11px] font-black tracking-tight">{sec.title}</span>
                            </div>
                            <ChevronRight size={14} className={activeSectionId === sec.id ? 'opacity-100' : 'opacity-0'} />
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 w-full min-w-0">
                    {activeSection?.type === 'intro' && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in">
                            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Info size={20} /></div> {activeSection.title}
                            </h3>
                            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                                {cleanHtml(activeSection.data.sectionDescription)}
                            </div>
                        </div>
                    )}

                    {(activeSection?.type === 'objective' || activeSection?.type === 'competency') && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-800 px-2">{activeSection.data.sectionName}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {(activeSection.type === 'objective' ? activeSection.data.objectives?.results : activeSection.data.competencies?.results)?.map((item, idx) => {
                                    const key = `${activeSection.id}_${item.itemId}`;
                                    const input = inputs[key];
                                    return (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 hover:border-indigo-100 transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${activeSection.type === 'objective' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{idx + 1}</div>
                                                <div className="space-y-1">
                                                    <h4 className="text-lg font-black text-slate-900">{item.name}</h4>
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{cleanHtml(item.metric || item.description)}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FeedbackCard title="Self Feedback" rating={input?.selfRating} comment={input?.selfComment} icon={Users} avatar={subjectPhoto} color="slate" isEditable={false} />
                                                <FeedbackCard title="Official Review" rating={input?.rating} comment={input?.comment} icon={UserCheck} color="blue" isEditable={true} onRatingChange={v => handleInputChange(key, 'rating', v)} onCommentChange={v => handleInputChange(key, 'comment', v)} permission={input?.ratingPermission} />
                                            </div>

                                            {input?.others?.length > 0 && (
                                                <div className="pt-4 border-t border-slate-50">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <MessageCircle size={14} className="text-amber-500" />
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Other Evaluators</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {input.others.map((other, oidx) => (
                                                            <div key={oidx} className="bg-amber-50/30 border border-amber-100/50 p-4 rounded-2xl relative">
                                                                <Quote size={12} className="absolute top-4 right-4 text-amber-200" />
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[8px] font-black">{other.firstName?.charAt(0) || 'O'}</div>
                                                                    <span className="text-[10px] font-black text-slate-500">{other.fullName}</span>
                                                                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-black ${other.rating === '5.0' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>RATING: {other.rating}</div>
                                                                </div>
                                                                <p className="text-xs text-slate-600 font-medium leading-relaxed">{other.comment || 'No comment provided.'}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeSection?.type === 'summary' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-800 px-2">{activeSection.title}</h3>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 blur-3xl opacity-50"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FeedbackCard title="Self Summary" rating={inputs.summary?.selfRating} comment={inputs.summary?.selfComment} icon={Users} avatar={subjectPhoto} color="slate" isEditable={false} />
                                    <FeedbackCard title="Official Final Result" rating={inputs.summary?.rating} comment={inputs.summary?.comment} icon={Star} color="blue" isEditable={true} onRatingChange={v => handleInputChange('summary', 'rating', v)} onCommentChange={v => handleInputChange('summary', 'comment', v)} permission={inputs.summary?.ratingPermission} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PMDetailView;
