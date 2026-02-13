/**
 * Project: react-sfsf-viewer
 * File: /src/components/PerformanceDetail.jsx
 * Description: SuccessFactors OData JSON 구조(results 배열)를 완벽히 반영한 동적 상세 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, Target, Award, MessageSquare, Info,
    Save, Send, Clock, FileText, ChevronRight, Quote,
    CheckCircle2, ChevronUp, ChevronDown
} from 'lucide-react';
import { sfService } from '../services/sfService';

const PerformanceDetail = ({ form, onBack }) => {
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
                // API 호출 (상세 데이터와 Route Map 병렬 호출)
                const [data, routeData] = await Promise.all([
                    sfService.getFormDetail(form.formContentId, form.formDataId),
                    sfService.getFormRouteMap(form.formDataId)
                ]);

                setDetail(data);
                setRouteMap(routeData);

                // JSON 구조 분해 (results[0] 접근)
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
                    const objSections = pmContent.objectiveSections?.results || [];
                    objSections.forEach((sec, sidx) => {
                        const sId = `obj_${sidx}`;
                        dynamicSections.push({
                            id: sId,
                            title: `${sec.sectionName}${sec.sectionWeight ? ` (${sec.sectionWeight}%)` : ''}`,
                            type: 'objective',
                            data: sec,
                            icon: Target
                        });

                        // 초기값 세팅 (목표)
                        sec.objectives?.results?.forEach((obj, oidx) => {
                            const key = `${sId}_${oidx}`;
                            initialInputs[key] = {
                                rating: obj.selfRatingComment?.rating || '',
                                comment: obj.selfRatingComment?.comment || ''
                            };
                        });
                    });

                    // 3. 역량 섹션
                    const compSections = pmContent.competencySections?.results || [];
                    compSections.forEach((sec, sidx) => {
                        const sId = `comp_${sidx}`;
                        dynamicSections.push({
                            id: sId,
                            title: `${sec.sectionName}${sec.sectionWeight ? ` (${sec.sectionWeight}%)` : ''}`,
                            type: 'competency',
                            data: sec,
                            icon: Award
                        });

                        // 초기값 세팅 (역량)
                        sec.competencies?.results?.forEach((comp) => {
                            const key = `${sId}_${comp.itemId}`;
                            initialInputs[key] = {
                                rating: comp.selfRatingComment?.rating || '',
                                comment: comp.selfRatingComment?.comment || ''
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
                            rating: summary.overallFormRating?.rating || '',
                            comment: summary.selfRatingComment?.comment || ''
                        };
                    }
                }

                setSections(dynamicSections);
                setInputs(initialInputs);
                if (dynamicSections.length > 0) {
                    setActiveSectionId(dynamicSections[0].id);
                }

            } catch (error) {
                console.error('Failed to load form detail', error);
            } finally {
                setLoading(false);
            }
        };

        if (form) fetchDetail();
    }, [form]);

    // 입력 핸들러
    const handleInputChange = (key, field, value) => {
        setInputs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    // 저장 핸들러 (Deep Upsert 연동)
    const handleSave = async () => {
        try {
            setIsSaving(true);
            const pmContent = detail?.pmReviewContentDetail?.results?.[0];
            if (!pmContent) return;

            const userId = detail.formHeader?.formSubjectId;

            // 1. 가이드 예시와 동일한 Deep Upsert 루트 구조 생성 (섹션 배열은 동적으로 추가)
            const rootPayload = {
                "__metadata": {
                    "uri": `FormPMReviewContentDetail(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L)`,
                    "type": "SFOData.FormPMReviewContentDetail"
                },
                "formContentId": String(form.formContentId),
                "formDataId": String(form.formDataId)
            };

            const objectiveSections = [];
            const competencySections = [];

            // 2. 목표 섹션 매핑
            const objSectionsArr = pmContent.objectiveSections?.results || [];
            objSectionsArr.forEach((sec, sidx) => {
                const sId = `obj_${sidx}`;
                const sectionUpdate = {
                    "__metadata": {
                        "uri": `FormObjectiveSection(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,sectionIndex=${sec.sectionIndex})`,
                        "type": "SFOData.FormObjectiveSection"
                    },
                    "sectionIndex": sec.sectionIndex,
                    "objectives": []
                };

                sec.objectives?.results?.forEach((obj, oidx) => {
                    const key = `${sId}_${oidx}`;
                    const input = inputs[key];

                    if (input) {
                        sectionUpdate.objectives.push({
                            "__metadata": {
                                "uri": `FormObjective(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${obj.itemId}L,sectionIndex=${sec.sectionIndex})`,
                                "type": "SFOData.FormObjective"
                            },
                            "itemId": String(obj.itemId),
                            "sectionIndex": sec.sectionIndex,
                            "selfRatingComment": {
                                "__metadata": {
                                    "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${obj.itemId}L,ratingType='na',sectionIndex=${sec.sectionIndex},userId='${userId}')`,
                                    "type": "SFOData.FormUserRatingComment"
                                },
                                "rating": input.rating ? parseFloat(input.rating).toFixed(1) : (obj.selfRatingComment?.rating || null),
                                "comment": input.comment ?? obj.selfRatingComment?.comment,
                                "ratingKey": obj.selfRatingComment?.ratingKey,
                                "commentKey": obj.selfRatingComment?.commentKey
                            }
                        });
                    }
                });
                if (sectionUpdate.objectives.length > 0) objectiveSections.push(sectionUpdate);
            });

            // 3. 역량 섹션 매핑
            const compSectionsArr = pmContent.competencySections?.results || [];
            compSectionsArr.forEach((sec, sidx) => {
                const sId = `comp_${sidx}`;
                const sectionUpdate = {
                    "__metadata": {
                        "uri": `FormCompetencySection(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,sectionIndex=${sec.sectionIndex})`,
                        "type": "SFOData.FormCompetencySection"
                    },
                    "sectionIndex": sec.sectionIndex,
                    "competencies": []
                };

                sec.competencies?.results?.forEach((comp) => {
                    const key = `${sId}_${comp.itemId}`;
                    const input = inputs[key];

                    if (input) {
                        sectionUpdate.competencies.push({
                            "__metadata": {
                                "uri": `FormCompetency(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${comp.itemId}L,sectionIndex=${sec.sectionIndex})`,
                                "type": "SFOData.FormCompetency"
                            },
                            "itemId": String(comp.itemId),
                            "sectionIndex": sec.sectionIndex,
                            "selfRatingComment": {
                                "__metadata": {
                                    "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=${comp.itemId}L,ratingType='na',sectionIndex=${sec.sectionIndex},userId='${userId}')`,
                                    "type": "SFOData.FormUserRatingComment"
                                },
                                "rating": input.rating ? parseFloat(input.rating).toFixed(1) : (comp.selfRatingComment?.rating || null),
                                "comment": input.comment ?? comp.selfRatingComment?.comment,
                                "ratingKey": comp.selfRatingComment?.ratingKey,
                                "commentKey": comp.selfRatingComment?.commentKey
                            }
                        });
                    }
                });
                if (sectionUpdate.competencies.length > 0) competencySections.push(sectionUpdate);
            });

            // 데이터가 있는 경우에만 필드 추가 (빈 배열 전송 방지)
            if (objectiveSections.length > 0) rootPayload.objectiveSections = objectiveSections;
            if (competencySections.length > 0) rootPayload.competencySections = competencySections;

            // 4. 요약 섹션 매핑
            if (pmContent.summarySection && inputs['summary']) {
                const summarySec = pmContent.summarySection;
                rootPayload.summarySection = {
                    "__metadata": {
                        "uri": `FormSummarySection(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L)`,
                        "type": "SFOData.FormSummarySection"
                    },
                    "selfRatingComment": {
                        "__metadata": {
                            "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=0L,ratingType='na',sectionIndex=${summarySec.sectionIndex},userId='${userId}')`,
                            "type": "SFOData.FormUserRatingComment"
                        },
                        "comment": inputs['summary'].comment ?? summarySec.selfRatingComment?.comment,
                        "commentKey": summarySec.selfRatingComment?.commentKey
                    },
                    "overallFormRating": {
                        "__metadata": {
                            "uri": `FormUserRatingComment(formContentId=${form.formContentId}L,formDataId=${form.formDataId}L,itemId=0L,ratingType='overall',sectionIndex=${summarySec.sectionIndex},userId='${userId}')`,
                            "type": "SFOData.FormUserRatingComment"
                        },
                        "rating": inputs['summary'].rating ? parseFloat(inputs['summary'].rating).toFixed(1) : (summarySec.overallFormRating?.rating || null),
                        "ratingKey": summarySec.overallFormRating?.ratingKey
                    }
                };
            }

            // 5. API 호출 (배열로 감싸서 전송)
            const response = await sfService.updateFormRating([rootPayload]);

            // 6. 결과 체크
            const results = response?.d || [];
            const result = results[0];

            if (result?.status === 'OK') {
                alert('SuccessFactors에 성공적으로 저장되었습니다.');
            } else {
                console.error('Upsert failed details:', result);
                alert(`저장에 실패했습니다: ${result?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Save critical failure', error);
            alert('저장 중 통신 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('common.loading')}</p>
        </div>
    );

    if (!detail) return null;

    const activeSection = sections.find(s => s.id === activeSectionId);

    // HTML 태그 제거 및 텍스트 정규화
    const cleanHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-20">
            {/* 상단 컨트롤러 */}
            <div className="grid grid-cols-2 md:flex md:items-center justify-between gap-3">
                <button
                    onClick={onBack}
                    className="group px-4 py-2.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <ChevronLeft size={16} className="text-slate-400 group-hover:text-indigo-600" />
                    <span className="text-xs font-black text-slate-600 group-hover:text-indigo-700">Back to Inbox</span>
                </button>
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-3 h-3 border border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                        ) : (
                            <Save size={14} className="text-slate-400" />
                        )}
                        Draft
                    </button>
                    <button className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                        <Send size={14} /> Submit
                    </button>
                </div>
            </div>

            {/* 헤더 배너 */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3">
                            <FileText size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                    {detail.formHeader?.currentStep}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <Clock size={12} /> D-15
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                                {detail.formHeader?.formTitle}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Route Map 섹션 */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm animate-in fade-in duration-700">
                <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setIsRouteMapExpanded(!isRouteMapExpanded)}
                >
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                        Route Map Progress
                    </h3>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        {isRouteMapExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>

                {isRouteMapExpanded && (
                    <div className="relative mt-8 animate-in slide-in-from-top-4 duration-500">
                        {/* 데스크탑 연결선 */}
                        <div className="absolute top-5.5 left-10 right-10 h-[2px] bg-slate-50 hidden md:block"></div>

                        <div className="flex md:grid md:grid-cols-4 items-start gap-8 justify-between relative z-10 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
                            {routeMap?.routeStep?.results?.map((step, idx) => {
                                const isCurrent = step.current === true;
                                const isCompleted = step.completed === true;

                                // 담당자 정보 추출 (Capture 기반: step 객체에 직접 데이터가 있음)
                                const subStep = step.routeSubStep?.results?.[0];
                                const processorName = step.userFullName || subStep?.userFullName || step.userRole || subStep?.userRole || (isCompleted ? 'Completed' : 'TBD');

                                return (
                                    <div key={idx} className="flex flex-col items-center text-center min-w-[140px] md:min-w-0 group">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-black mb-4 transition-all duration-300 relative ${isCurrent
                                            ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-110 border-4 border-white ring-2 ring-indigo-600'
                                            : (isCompleted ? 'bg-white text-indigo-600 border border-indigo-100 shadow-sm' : 'bg-white border border-slate-100 text-slate-300')
                                            }`}>
                                            {isCompleted ? <CheckCircle2 size={18} className="text-indigo-500" /> : idx + 1}

                                            {/* 현재 단계 표시 뱃지 */}
                                            {isCurrent && (
                                                <span className="absolute -top-2 -right-2 flex h-4 w-4">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white"></span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 px-2">
                                            <p className={`text-[11px] font-black leading-tight break-keep max-w-[120px] mx-auto ${isCurrent ? 'text-indigo-600' : (isCompleted ? 'text-slate-800 font-bold' : 'text-slate-400')
                                                }`}>
                                                {step.stepName}
                                            </p>
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold transition-all ${isCurrent
                                                ? 'bg-indigo-50 border-indigo-100 text-indigo-500 shadow-sm'
                                                : 'bg-slate-50 border-slate-100 text-slate-400'
                                                }`}>
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
                                                    <div className="p-4 bg-slate-50 border border-slate-100/50 rounded-2xl text-xs text-slate-600 font-medium leading-relaxed">
                                                        {cleanHtml(obj.metric) || '미정의'}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block ml-1">Self Rating</label>
                                                        <select
                                                            value={inputs[`${activeSection.id}_${idx}`]?.rating || ''}
                                                            onChange={(e) => handleInputChange(`${activeSection.id}_${idx}`, 'rating', e.target.value)}
                                                            className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-extrabold text-slate-700 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all cursor-pointer"
                                                        >
                                                            <option value="">Select a rating...</option>
                                                            <option value="5">5 - Outstanding</option>
                                                            <option value="4">4 - Exceeds Expectations</option>
                                                            <option value="3">3 - Meets Expectations</option>
                                                            <option value="2">2 - Needs Improvement</option>
                                                            <option value="1">1 - Unsatisfactory</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block ml-1">Comments</label>
                                                        <textarea
                                                            value={inputs[`${activeSection.id}_${idx}`]?.comment || ''}
                                                            onChange={(e) => handleInputChange(`${activeSection.id}_${idx}`, 'comment', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all min-h-[100px] resize-none"
                                                            placeholder="성과에 대한 구체적인 의견을 남겨주세요..."
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
                            <div className="grid grid-cols-1 gap-4">
                                {activeSection.data.competencies?.results?.map((comp, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:border-purple-200 transition-all group">
                                        <div className="p-8">
                                            <div className="flex items-start justify-between gap-8 flex-col md:flex-row">
                                                <div className="flex gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 group-hover:rotate-6 transition-transform">
                                                        <Award size={28} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-lg font-black text-slate-900 leading-tight">{comp.name}</h4>
                                                        <div className="text-xs text-slate-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                                            {cleanHtml(comp.description)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="self-end md:self-start shrink-0 text-center md:text-right bg-white p-4 rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
                                                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-3 tracking-widest">Rating</p>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map(v => {
                                                            const key = `${activeSection.id}_${comp.itemId}`;
                                                            const currentRating = inputs[key]?.rating ? parseInt(inputs[key].rating) : 0;
                                                            return (
                                                                <button
                                                                    key={v}
                                                                    onClick={() => handleInputChange(key, 'rating', String(v))}
                                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${v <= currentRating ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-white border-slate-200 text-slate-300 hover:border-purple-200'}`}
                                                                >
                                                                    {v}
                                                                </button>
                                                            );
                                                        })}
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
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all ${v <= currentRating ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-200'}`}
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

export default PerformanceDetail;
