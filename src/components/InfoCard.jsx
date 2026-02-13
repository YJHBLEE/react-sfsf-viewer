/**
 * Project: react-sfsf-viewer
 * File: /src/components/InfoCard.jsx
 */

import React from 'react';

const InfoCard = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors group">
        <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <Icon size={14} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</p>
            <p className="text-xs font-semibold text-slate-700 truncate">{value || '-'}</p>
        </div>
    </div>
);

export default InfoCard;
