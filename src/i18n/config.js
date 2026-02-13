/**
 * Project: react-sfsf-viewer
 * File: /src/i18n/config.js
 * Description: i18next 다국어 초기 설정
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 번역 파일 로드 (JSON)
import commonEn from './locales/en/common.json';
import commonKo from './locales/ko/common.json';
import commonJp from './locales/jp/common.json';

const resources = {
    en: { common: commonEn },
    ko: { common: commonKo },
    jp: { common: commonJp },
};

i18n
    .use(LanguageDetector) // 사용자 브라우저 언어 탐지
    .use(initReactI18next) // react-i18next 바인딩
    .init({
        resources,
        lng: 'ko', // 기본 언어 (나중에 SF 설정 연동 시 변경 가능)
        fallbackLng: 'en', // 해당 언어 번역이 없을 경우 대체 언어
        ns: ['common'], // 네임스페이스
        defaultNS: 'common',
        interpolation: {
            escapeValue: false, // 리액트는 자체적으로 XSS 방지를 하므로 false 설정
        },
        detection: {
            order: ['queryString', 'cookie', 'localStorage', 'navigator'],
            caches: ['localStorage', 'cookie'],
        },
    });

export default i18n;
