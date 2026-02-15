/**
 * Project: react-sfsf-viewer
 * File: /src/components/RouteMapStepView.jsx
 * Description: 평가 프로세스 타임라인(Route Map) 공통 컴포넌트
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';

const RouteMapStepView = ({ routeMap, title = "Process Timeline", color = "purple" }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!routeMap?.routeStep?.results) return null;

    // 테마 색상 정의
    const theme = {
        purple: {
            active: 'bg-purple-600 text-white shadow-2xl shadow-purple-200 ring-purple-600',
            completed: 'bg-white text-purple-600 border-purple-100',
            hover: 'group-hover:bg-purple-50 group-hover:text-purple-600',
            text: 'text-purple-600'
        },
        indigo: {
            active: 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 ring-indigo-600',
            completed: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            hover: 'group-hover:bg-indigo-50 group-hover:text-indigo-600',
            text: 'text-indigo-600'
        }
    }[color] || {
        active: 'bg-purple-600 text-white shadow-2xl shadow-purple-200 ring-purple-600',
        completed: 'bg-white text-purple-600 border-purple-100',
        hover: 'group-hover:bg-purple-50 group-hover:text-purple-600',
        text: 'text-purple-600'
    };

    return (
        <div className="mt-8 pt-8 border-t border-slate-100">
            <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h3>
                </div>
                <div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 ${theme.hover} transition-all`}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {isExpanded && (
                <div className="relative mt-8 animate-in slide-in-from-top-4 duration-500 overflow-x-auto pb-4 no-scrollbar">
                    <div className="flex flex-col md:flex-row justify-between relative gap-8 md:gap-4 px-2 min-w-max md:min-w-0">
                        {routeMap.routeStep.results.map((step, idx) => {
                            const isCurrent = step.current;
                            const isCompleted = step.completed;
                            const subStep = step.routeSubStep?.results?.[0];
                            const processorName = step.userFullName || subStep?.userFullName || step.userRole || subStep?.userRole || (isCompleted ? 'Completed' : 'TBD');

                            return (
                                <div key={idx} className="flex flex-col items-center text-center relative z-10 group min-w-[120px] md:min-w-0 md:flex-1">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-black mb-4 transition-all duration-300 relative ${isCurrent
                                        ? `${theme.active} scale-110 border-4 border-white ring-2`
                                        : (isCompleted ? `${theme.completed} border shadow-sm` : 'bg-white border border-slate-100 text-slate-300')
                                        }`}>
                                        {isCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                                    </div>
                                    <div className="space-y-1.5 px-2">
                                        <p className={`text-[11px] font-black leading-tight break-keep max-w-[100px] mx-auto ${isCurrent ? theme.text : (isCompleted ? 'text-slate-800' : 'text-slate-400')}`}>
                                            {step.stepName}
                                        </p>
                                        <div className="text-[9px] font-bold text-slate-400">
                                            {processorName}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {/* 데스크탑에서 단계를 잇는 선 */}
                        <div className="hidden md:block absolute top-[22px] left-10 right-10 h-0.5 bg-slate-100 -z-0"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteMapStepView;
