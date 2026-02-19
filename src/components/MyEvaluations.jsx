/**
 * Project: react-sfsf-viewer
 * File: /src/components/MyEvaluations.jsx
 * Description: '나의 평가' 화면 - 롯데월드타워 배경의 에디토리얼 디자인
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, TrendingUp, Calendar, ChevronRight, BarChart3, Award, Info } from 'lucide-react';

const MyEvaluations = () => {
    const { t } = useTranslation();

    // 이미지 무한 로딩 방지를 위한 상태 관리
    const [heroImg, setHeroImg] = useState('buildings.avif');

    const handleImgError = (e) => {
        // 브라우저의 기본 에러 핸들링 중단
        e.target.onerror = null;

        // 이미 대체 이미지인 경우 더 이상 시도하지 않음
        const fallback = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop';
        if (heroImg !== fallback) {
            setHeroImg(fallback);
        }
    };

    // Mock Data for Evaluation History
    const history = [
        { id: 1, year: '2023', period: '2H', grade: 'A', score: 4.5, reviewer: 'Sarah Connor', status: 'Completed', date: '2023.12.31' },
        { id: 2, year: '2023', period: '1H', grade: 'B+', score: 3.8, reviewer: 'Sarah Connor', status: 'Completed', date: '2023.06.30' },
        { id: 3, year: '2022', period: 'Year', grade: 'A', score: 4.2, reviewer: 'Kyle Reese', status: 'Completed', date: '2022.12.31' },
    ];

    // LOTTE Brand Colors
    const LOTTE_RED = '#DA291C';
    const LOTTE_TEAL = '#00AC9A';
    const maxScore = 5.0;

    return (
        <div className="bg-white min-h-screen text-slate-900 pb-20 animate-in fade-in duration-700">

            {/* --- SECTION 1: VISION HERO (Split Editorial Layout) --- */}
            <div className="flex flex-col md:flex-row h-auto md:h-[320px] border-b border-slate-200">
                {/* Left Header Block: Solid Background for Readability */}
                <div className="flex-1 p-10 flex flex-col justify-between bg-slate-900">
                    <div className="max-w-xl">
                        <p className="text-white/40 font-black text-xl md:text-2xl tracking-tighter mb-0 uppercase italic">
                            Translate Vision
                        </p>
                        <h1 className="text-white font-black text-5xl md:text-7xl tracking-tighter leading-none">
                            INTO VALUE
                        </h1>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="bg-[#DA291C] h-10 w-1.5"></div>
                        <p className="text-white/80 text-sm font-bold leading-relaxed">
                            롯데의 비전을 가치로 바꾸는<br />당신의 성과 기록입니다.
                        </p>
                    </div>
                </div>

                {/* Right Image Block: Swapped to Building Forest */}
                <div className="flex-[1.2] relative bg-slate-50 overflow-hidden">
                    <img
                        src={heroImg}
                        alt="Building Forest"
                        className="w-full h-full object-cover object-center scale-110"
                        onError={handleImgError}
                    />
                    {/* Bottom Page Indicator Style */}
                    <div className="absolute bottom-6 left-10 flex items-center gap-4">
                        <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black w-8 h-8 rounded-full flex items-center justify-center border border-white/30">01</span>
                        <span className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em]">Lotte Heritage</span>
                    </div>
                </div>
            </div>

            {/* --- SECTION 2: PERFORMANCE TREND (Report Style) --- */}
            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
                    <div className="md:col-span-4">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="text-[#DA291C]" size={20} />
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Performance Metrics</h3>
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter mb-8 leading-tight">
                            성과 트렌드 분석
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-10">
                            지속적인 역량 강화와 성과 창출을 통해 당신이 롯데에 기여한 핵심 가치를 시각화합니다.
                            과거의 기록은 앞으로의 성장을 위한 소중한 자산입니다.
                        </p>
                        <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-slate-900">
                            <div className="flex items-center gap-2 mb-2">
                                <Award size={16} className="text-[#DA291C]" />
                                <span className="text-xs font-black">Current Status</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">최근 평가에서 <span className="text-[#DA291C] font-black">Grade A</span>를 달성하며 탁월한 성과를 보였습니다.</p>
                        </div>
                    </div>

                    <div className="md:col-span-8 bg-slate-50/50 rounded-3xl p-10 border border-slate-100 relative overflow-hidden">
                        {/* Decorative Background Text */}
                        <div className="absolute -right-10 -bottom-10 text-[120px] font-black text-black/[0.03] select-none pointer-events-none uppercase">
                            Trend
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-end justify-between h-56 gap-8 border-b border-slate-200 pb-2">
                                {history.slice().reverse().map((item) => {
                                    const isLatest = item.id === history[0].id; // history[0] is 2023 2H
                                    return (
                                        <div key={item.id} className="flex flex-col items-center flex-1 gap-4 group">
                                            <div className="w-full flex justify-center items-end h-40">
                                                <div
                                                    className={`w-16 transition-all duration-700 relative cursor-pointer ${isLatest ? 'bg-[#DA291C]' : 'bg-slate-200 hover:bg-[#DA291C]'}`}
                                                    style={{ height: `${(item.score / maxScore) * 100}%` }}
                                                >
                                                    <div className={`absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black py-2 px-3 rounded shadow-xl ${isLatest ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity whitespace-nowrap`}>
                                                        Score: {item.score} / 5.0
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] font-black text-slate-800 tracking-tighter uppercase whitespace-nowrap">
                                                    {item.year} {item.period}
                                                </p>
                                                <p className={`text-[10px] font-bold mt-0.5 ${isLatest ? 'text-[#DA291C]' : 'text-slate-400 group-hover:text-[#DA291C]'}`}>{item.grade}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: EVALUATION HISTORY (Magazine List Style) --- */}
            <div className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-100">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h3 className="text-4xl font-black tracking-tighter">Evaluation History</h3>
                        <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">인사 기록 가치 체계</p>
                    </div>
                    <div className="h-[1px] flex-1 bg-slate-100 mx-10 hidden md:block"></div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <FileText size={20} />
                        <span className="text-xs font-black uppercase">Total 3 Docs</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {history.map((item) => (
                        <div key={item.id} className="group grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-8 bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-500 cursor-pointer">
                            {/* Year/Period Col */}
                            <div className="md:col-span-2">
                                <span className="text-4xl font-black text-slate-200 group-hover:text-slate-900 transition-colors leading-none italic">{item.year}</span>
                                <p className="text-[10px] font-black text-slate-400 group-hover:text-[#DA291C] uppercase tracking-widest mt-1">{item.period} Review</p>
                            </div>

                            {/* Title Col */}
                            <div className="md:col-span-5">
                                <h4 className="text-lg font-black text-slate-800 tracking-tight group-hover:translate-x-1 transition-transform">
                                    Performance Review - {item.year} {item.period}
                                </h4>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[10px] font-bold text-[#00AC9A] bg-emerald-50 px-2 py-0.5 uppercase tracking-tighter">{item.status}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Reviewer: {item.reviewer}</span>
                                </div>
                            </div>

                            {/* Data Col */}
                            <div className="md:col-span-2 text-right md:text-left">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Final Grade</p>
                                <span className="text-2xl font-black text-slate-900">{item.grade}</span>
                            </div>

                            {/* Date Col */}
                            <div className="md:col-span-2 text-right md:text-left">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Completion Date</p>
                                <span className="text-xs font-bold text-slate-600">{item.date}</span>
                            </div>

                            {/* Action Col */}
                            <div className="md:col-span-1 flex justify-end">
                                <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-[#DA291C] group-hover:text-white group-hover:border-[#DA291C] transition-all shadow-sm">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Tip */}
                <div className="mt-20 p-8 bg-slate-900 text-white rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <Info size={24} className="text-[#FABE00]" />
                        </div>
                        <div>
                            <h5 className="font-extrabold text-lg tracking-tight">상세 평가 피드백을 확인하고 싶으신가요?</h5>
                            <p className="text-white/60 text-xs font-medium mt-1">각 평가 항목을 클릭하면 본인 평가 및 상급자의 코멘트를 상세히 확인할 수 있습니다.</p>
                        </div>
                    </div>
                    <button className="px-8 py-4 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-[#DA291C] hover:text-white transition-all shadow-xl active:scale-95">
                        Go to Details
                    </button>
                </div>
            </div>

        </div>
    );
};

export default MyEvaluations;
