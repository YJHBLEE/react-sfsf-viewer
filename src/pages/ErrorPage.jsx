/**
 * Project: react-sfsf-viewer
 * File: /src/pages/ErrorPage.jsx
 * Description: 404, 500 등 시스템 오류 시 표시되는 커스텀 에러 페이지
 */

import React from 'react';
import { AlertCircle, RefreshCcw, Home, Ghost } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ErrorPage = ({ status, error }) => {
    const { t } = useTranslation();

    // 상태 코드별 메시지 및 아이콘 설정
    const getErrorConfig = () => {
        const code = status || (error?.response?.status) || 500;

        switch (code) {
            case 404:
                return {
                    icon: Ghost,
                    title: t('error.404.title', '길을 잃으셨나요?'),
                    desc: t('error.404.desc', '찾으시는 페이지가 없거나 권한이 부족하여 볼 수 없어요.'),
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-50'
                };
            case 403:
                return {
                    icon: AlertCircle,
                    title: t('error.403.title', '접근 권한이 없어요'),
                    desc: t('error.403.desc', '해당 데이터를 보기 위한 권한이 부족한 것 같아요. 관리자에게 문의해 주세요.'),
                    color: 'text-amber-500',
                    bgColor: 'bg-amber-50'
                };
            default:
                return {
                    icon: AlertCircle,
                    title: t('error.500.title', '잠시 연결이 원활하지 않아요'),
                    desc: t('error.500.desc', '시스템에 일시적인 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.'),
                    color: 'text-red-500',
                    bgColor: 'bg-red-50'
                };
        }
    };

    const config = getErrorConfig();
    const Icon = config.icon;

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA] p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 text-center relative overflow-hidden">

                {/* 데코레이션 배경 */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 ${config.bgColor} rounded-full opacity-50 blur-3xl`}></div>
                <div className={`absolute -bottom-10 -left-10 w-32 h-32 ${config.bgColor} rounded-full opacity-50 blur-3xl`}></div>

                {/* 아이콘 섹션 */}
                <div className={`mx-auto w-20 h-20 ${config.bgColor} ${config.color} rounded-2xl flex items-center justify-center mb-8 transform transition-transform hover:scale-110 duration-300`}>
                    <Icon size={40} strokeWidth={1.5} />
                </div>

                {/* 텍스트 섹션 */}
                <h1 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">
                    {config.title}
                </h1>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-10 px-4">
                    {config.desc}
                    {error?.message && (
                        <span className="block mt-2 text-[11px] text-slate-400 font-mono opacity-60">
                            Error code: {status || error?.response?.status || 'Unknown'} | {error.message}
                        </span>
                    )}
                </p>

                {/* 액션 버튼 */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleRefresh}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                    >
                        <RefreshCcw size={18} />
                        {t('common.retry', '다시 시도하기')}
                    </button>

                    <button
                        onClick={handleGoHome}
                        className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        <Home size={18} />
                        {t('common.goHome', '홈으로 돌아가기')}
                    </button>
                </div>
            </div>

            {/* 푸터 문구 */}
            <p className="mt-8 text-slate-400 text-[13px] font-medium">
                {t('common.contactSupport', '문제가 지속되면 시스템 가이드를 확인해 주세요.')}
            </p>
        </div>
    );
};

export default ErrorPage;
