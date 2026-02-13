/**
 * Project: react-sfsf-viewer
 * File: /src/components/TimelineItem.jsx
 */

import React from 'react';
import { Building2 } from 'lucide-react';

const TimelineItem = ({ job, isLast }) => {
    // 날짜 파싱 로직 (SF OData 특유의 /Date(123456789)/ 형식 처리)
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const match = dateStr.match(/\d+/);
        return match ? new Date(parseInt(match[0])).toLocaleDateString() : '-';
    };

    return (
        <div className="relative pl-6 pb-6">
            {/* Line */}
            {!isLast && (
                <div className="absolute top-1.5 left-[7px] h-full w-[1px] bg-slate-200" />
            )}

            {/* Dot */}
            <div className="absolute top-1.5 left-0 w-4 h-4 rounded-full border-[3px] border-white bg-indigo-500 shadow-sm z-10" />

            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm leading-none">{job.jobTitle}</h4>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {formatDate(job.startDate)}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                    <Building2 size={12} className="text-slate-400" />
                    <span>{job.departmentNav?.name || job.department}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">{job.companyNav?.name}</span>
                </div>

                <div className="mt-1">
                    <span className="inline-flex items-center text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {job.eventNav?.name || job.event}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TimelineItem;
