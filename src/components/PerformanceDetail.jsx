/**
 * Project: react-sfsf-viewer
 * File: /src/components/PerformanceDetail.jsx
 * Description: 평가서 타입(PM vs 360)에 따라 적절한 상세 뷰를 렌더링하는 컨테이너 컴포넌트
 */

import React from 'react';
import PMDetailView from './PMDetailView';
import _360MultiRaterDetailView from './360MultiRaterDetailView';

const PerformanceDetail = ({ form, onBack }) => {
    // 평가 유형에 따라 컴포넌트 분기
    // PerformanceInbox에서 분류한 form.displayType을 기반으로 판단
    if (form.displayType === '360') {
        return <_360MultiRaterDetailView form={form} onBack={onBack} />;
    }

    // 기본적으로 일반 성과평가(PM) 뷰 반환
    return <PMDetailView form={form} onBack={onBack} />;
};

export default PerformanceDetail;
