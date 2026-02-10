sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Picklist Labels에서 현재 locale에 맞는 라벨을 찾아 '라벨 (코드)' 형식으로 반환
         * @param {array} aLabels picklistLabels/results 배열
         * @param {string} sCode 항목의 코드값
         * @returns {string} 명칭 (코드)
         */
        getPicklistLabel: function (aLabels, sCode) {
            if (!sCode) return "";
            
            // aLabels가 results 객체를 포함한 경우와 직접 배열인 경우 모두 대응
            var aTargetLabels = (aLabels && aLabels.results) ? aLabels.results : aLabels;
            if (!Array.isArray(aTargetLabels) || aTargetLabels.length === 0) return sCode;

            // UI5 locale (ko-KR)을 SF locale (ko_KR) 형식으로 변환
            var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage().replace("-", "_");

            var oLabel = aTargetLabels.find(function (item) {
                return item.locale === sCurrentLocale;
            }) || aTargetLabels.find(function (item) {
                return item.locale === "en_US"; // 기본값으로 영어 시도
            }) || aTargetLabels[0]; // 최후의 수단으로 첫 번째 항목

            return oLabel ? oLabel.label + " (" + sCode + ")" : sCode;
        }
    };
});