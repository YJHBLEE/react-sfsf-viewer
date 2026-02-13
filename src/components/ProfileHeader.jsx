/**
 * Project: react-sfsf-viewer
 * File: /src/components/ProfileHeader.jsx
 */

import React from 'react';
import { Briefcase, Building2, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ProfileHeader = ({ profile, photo, activeTab, setActiveTab }) => {
    const { t } = useTranslation();

    const tabs = [
        { id: 'overview', label: t('profile.tabs.overview') },
        { id: 'jobhistory', label: t('profile.tabs.jobhistory') },
        { id: 'compensation', label: t('profile.tabs.compensation') },
        { id: 'documents', label: t('profile.tabs.documents') },
    ];

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm pt-6 px-6 relative">
            <div className="flex flex-col md:flex-row items-start gap-5">
                {/* Profile Photo */}
                <div className="w-20 h-20 rounded-lg border border-slate-100 shadow-sm overflow-hidden bg-slate-50 shrink-0">
                    {photo ? (
                        <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Users size={32} />
                        </div>
                    )}
                </div>

                {/* Info Area */}
                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                {profile ? `${profile.firstName} ${profile.lastName}` : t('common.loading')}
                            </h2>
                            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                <Briefcase size={14} /> {profile?.title || t('profile.notRegistered')}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                                    <Building2 size={12} /> {profile?.department || '-'}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                                    <MapPin size={12} /> {profile?.location || '-'}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
                                {t('profile.orgChart')}
                            </button>
                            <button className="px-3 py-1.5 bg-slate-900 border border-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors shadow-sm">
                                {t('profile.actions')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 flex items-center gap-6 border-t border-slate-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pt-3 pb-3 text-xs font-bold transition-all relative uppercase tracking-wide ${activeTab === tab.id
                            ? 'text-indigo-600'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-600" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProfileHeader;
