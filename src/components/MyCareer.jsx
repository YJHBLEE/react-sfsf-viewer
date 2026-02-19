/**
 * Project: react-sfsf-viewer
 * File: /src/components/MyCareer.jsx
 * Description: '나의 커리어' 대시보드 - 롯데 지속가능경영보고서 스타일 에디토리얼 디자인
 */

import React, { useState } from 'react';
import { Calendar, Target, ArrowRight, User, Award, Shield, Zap, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MyCareer = ({ profile }) => {
    const { t } = useTranslation();

    // 이미지 무한 로딩 방지를 위한 상태 관리
    const [heroImg, setHeroImg] = useState('ltower.jpeg');

    const handleImgError = (e) => {
        // 브라우저의 기본 에러 핸들링 중단
        e.target.onerror = null;

        // 이미 대체 이미지인 경우 더 이상 시도하지 않음
        if (heroImg !== 'buildings.avif') {
            setHeroImg('buildings.avif');
        }
    };

    // Mock Data for Schedule
    const schedules = [
        { id: 1, title: '2024년 상반기 자가 평가 마감', date: '2024.03.31', type: 'urgent', dDay: 'D-3' },
        { id: 2, title: '팀장님과의 1:1 면담', date: '2024.02.20', type: 'meeting' },
        { id: 3, title: '2024년 성과 목표 확정', date: '2024.02.28', type: 'normal' }
    ];

    // Mock Data for Goals
    const goals = [
        { id: 1, title: '고객 중심 디지털 전환(DT) 역량 강화', progress: 65, status: 'On Track' },
        { id: 2, title: '글로벌 사업 경쟁력 확보를 위한 어학 역량', progress: 30, status: 'At Risk' },
    ];

    // LOTTE Brand Colors
    const LOTTE_RED = '#DA291C';
    const LOTTE_YELLOW = '#FABE00'; // Marigold yellow from sustainable report
    const LOTTE_TEAL = '#00AC9A';   // Teal from report graphics
    const SKY_BLUE = '#0059B2';     // Blue matching the Lotte Tower sky photo

    return (
        <div className="bg-white min-h-screen text-slate-900 pb-20 animate-in fade-in duration-700">

            {/* --- SECTION 1: EDITORIAL HERO (Magazine Style) --- */}
            <div className="flex flex-col md:flex-row h-auto md:h-[320px] border-b border-slate-200">
                {/* Left Header Block */}
                <div className="flex-1 p-10 flex flex-col justify-between" style={{ backgroundColor: SKY_BLUE }}>
                    <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tighter">
                        Lifetime<br />Value Creator
                    </h1>
                    <div className="mt-4">
                        <div className="w-16 h-1 border-t-4 border-white mb-4"></div>
                        <p className="text-white font-bold opacity-80 text-lg">
                            오늘을 새롭게, 내일을 이롭게<br />Growth Together
                        </p>
                    </div>
                </div>
                {/* Right Image Block: Swapped to Lotte Tower */}
                <div className="flex-[1.5] relative bg-slate-50 overflow-hidden group">
                    <img
                        src={heroImg}
                        alt="Lotte World Tower"
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[4000ms]"
                        onError={handleImgError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                    {/* Welcome Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur p-5 shadow-2xl">
                        <p className="text-[10px] font-black text-[#DA291C] uppercase tracking-[0.2em] mb-1">Welcome Message</p>
                        <h2 className="text-xl font-black text-slate-800">
                            {profile?.firstName}님, 오늘의 성장을 기록하세요.
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium italic">
                            &quot;함께 성장하는 즐거움을 만들어갑니다.&quot;
                        </p>
                    </div>
                </div>
            </div>

            {/* --- SECTION 2: STATS & SCHEDULE (Editorial Grid) --- */}
            <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">

                {/* HR Strategy Summary */}
                <div className="md:col-span-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="text-[#DA291C]" size={20} />
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">HR Strategy</h3>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter mb-8 leading-tight">
                        공정하고 투명하게 인재를 채용하며,<br />
                        <span className="text-[#DA291C]">공정하고 합리적으로 평가/보상합니다</span>
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        롯데는 다양한 인재양성 프로그램과 복지정책을 기반으로 임직원의 몰입도 제고를 지원하며, 안전하고 건강한 근무환경 및 다양성을 존중하고 포용하는 기업문화를 조성하여 조직의 생산성과 혁신성을 높이고 있습니다.
                    </p>
                </div>

                {/* Talent Philosophy Cards */}
                <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 border-t-2 border-slate-100 bg-slate-50/30 group hover:bg-white hover:shadow-xl transition-all duration-500">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#DA291C] transition-colors">
                            <Zap className="text-[#DA291C] group-hover:text-white" size={24} />
                        </div>
                        <h4 className="text-lg font-black mb-4">실패를 두려워하지 않는 인재</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            변화의 중심에서 새로운 가치를 창출하기 위해 도전하고, 실패를 통해 더 큰 성장을 이루어내는 용기를 지지합니다.
                        </p>
                    </div>
                    <div className="p-8 border-t-2 border-slate-100 bg-slate-50/30 group hover:bg-white hover:shadow-xl transition-all duration-500">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#DA291C] transition-colors">
                            <TrendingUp className="text-[#DA291C] group-hover:text-white" size={24} />
                        </div>
                        <h4 className="text-lg font-black mb-4">실력을 키우기 위해 노력하는 인재</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            현재의 성과에 안주하지 않고, 자신의 전문성을 지속적으로 고도화하여 최고의 전문성을 지향하는 실행력을 존중합니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: MY PERFORMANCE SUMMARY --- */}
            <div className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                    {/* Goals Progress */}
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Target className="text-[#DA291C]" size={20} />
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">My Goals</h3>
                            </div>
                            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-[#DA291C] transition-colors">
                                View All <ArrowRight size={12} />
                            </button>
                        </div>
                        <div className="space-y-10">
                            {goals.map(goal => (
                                <div key={goal.id}>
                                    <div className="flex justify-between items-end mb-3">
                                        <p className="font-black text-slate-800 tracking-tight">{goal.title}</p>
                                        <p className="text-2xl font-black text-[#DA291C] tabular-nums">{goal.progress}%</p>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full bg-[#DA291C] transition-all duration-1000"
                                            style={{ width: `${goal.progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{goal.status}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Schedule */}
                    <div>
                        <div className="flex items-center gap-2 mb-8">
                            <Calendar className="text-[#DA291C]" size={20} />
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Schedule</h3>
                        </div>
                        <div className="space-y-4">
                            {schedules.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50 hover:bg-white hover:shadow-lg transition-all border-l-4 border-transparent hover:border-[#DA291C] cursor-pointer">
                                    <div>
                                        <p className="font-bold text-slate-800">{item.title}</p>
                                        <p className="text-xs text-slate-400 font-medium mt-1">{item.date}</p>
                                    </div>
                                    {item.dDay && (
                                        <span className="bg-[#DA291C] text-white text-[10px] font-black px-3 py-1 rounded-full">
                                            {item.dDay}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Editorial Decoration Footer */}
            <div className="mt-20 border-t border-slate-200 py-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end">
                    <div className="text-[80px] font-black text-slate-100 leading-none select-none">
                        2024
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-[#DA291C] uppercase tracking-[0.4em] mb-2">Lotte Performance Assessment System</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">© 2024 LOTTE. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyCareer;
