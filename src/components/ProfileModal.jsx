/**
 * Project: react-sfsf-viewer
 * File: /src/components/ProfileModal.jsx
 * Description: 사용자 프로필을 보여주는 모달 컴포넌트 (기존 ProfileHeader + InfoCard + TimelineItem 통합)
 */

import React, { useState } from 'react';
import { X, Mail, Phone, Link2, Briefcase, Building2, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InfoCard from './InfoCard';
import TimelineItem from './TimelineItem';

const ProfileModal = ({ profile, photo, jobHistory, onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');

    if (!profile) return null;

    const tabs = [
        { id: 'overview', label: t('profile.tabs.overview') },
        { id: 'jobhistory', label: t('profile.tabs.jobhistory') },
        // { id: 'compensation', label: t('profile.tabs.compensation') },
        // { id: 'documents', label: t('profile.tabs.documents') },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Modal Header (Profile Summary) */}
                <div className="relative bg-white p-6 border-b border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col md:flex-row items-start gap-6 pr-10">
                        {/* Profile Photo */}
                        <div className="w-24 h-24 rounded-xl border border-slate-100 shadow-sm overflow-hidden bg-slate-50 shrink-0">
                            {photo ? (
                                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Users size={40} />
                                </div>
                            )}
                        </div>

                        {/* Info Area */}
                        <div className="flex-1 min-w-0 pt-1">
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                {profile.firstName} {profile.lastName}
                            </h2>
                            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                <Briefcase size={14} /> {profile.title || t('profile.notRegistered')}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                                    <Building2 size={12} /> {profile.department || '-'}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                                    <MapPin size={12} /> {profile.location || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-6 mt-6 border-b border-transparent">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-2 text-sm font-bold transition-all relative ${activeTab === tab.id
                                        ? 'text-indigo-600'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-indigo-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="overflow-y-auto p-6 bg-slate-50 flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* Left Column: Contact & Skills */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-slate-800">{t('profile.contactInfo')}</h3>
                                    <button className="text-slate-400 hover:text-indigo-600"><Link2 size={14} /></button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <InfoCard icon={Mail} label="Email Address" value={profile.email} />
                                    <InfoCard icon={Phone} label="Business Phone" value={profile.businessPhone} />
                                    <InfoCard icon={Phone} label="Cell Phone" value={profile.cellPhone || t('profile.notRegistered')} />
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-3">{t('profile.skills')}</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {['SAP SuccessFactors', 'React', 'Fiori', 'JavaScript', 'Team Leadership'].map(skill => (
                                        <span key={skill} className="px-2.5 py-1 bg-[#F1F3F5] text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-md hover:border-slate-300 transition-colors cursor-default">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Tab Content */}
                        <div className="lg:col-span-8">
                            {activeTab === 'overview' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50">
                                            {t('activity.recentJob')}
                                        </h3>
                                        <div className="pl-1">
                                            {jobHistory && jobHistory.slice(0, 3).map((job, idx) => (
                                                <TimelineItem key={idx} job={job} isLast={idx === 2 || idx === jobHistory.length - 1} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'jobhistory' && (
                                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-5">{t('profile.tabs.jobhistory')}</h3>
                                    <div className="pl-1">
                                        {jobHistory && jobHistory.map((job, idx) => (
                                            <TimelineItem key={idx} job={job} isLast={idx === jobHistory.length - 1} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-2 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {t('common.close')}
                    </button>
                    {/* Action buttons can go here */}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
