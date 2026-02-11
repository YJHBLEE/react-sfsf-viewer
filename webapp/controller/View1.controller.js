sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], (Controller, JSONModel, Fragment) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit() {
            const oViewModel = new JSONModel({
                busy: true,
                photoUrl: "",
                jobHistory: []
            });
            this.getView().setModel(oViewModel, "view");

            const oUserModel = new JSONModel();
            this.getView().setModel(oUserModel, "userInfo");

            // 1. User API를 통해 현재 로그인한 사용자 정보 가져오기
            oUserModel.loadData("user-api/currentUser").then(() => {
                const sUserId = oUserModel.getProperty("/name");
                this._loadSFData(sUserId || "sfadmin");
            }).catch(() => {
                this._loadSFData("sfadmin");
            });
        },

        _loadSFData(sUserId) {
            const oViewModel = this.getView().getModel("view");
            const oModel = this.getOwnerComponent().getModel();
            // 데이터 정확성 확인을 위해 Batch 모드 비활성화
            oModel.setUseBatch(false);

            const sPath = `/User('${sUserId}')`;
            const sPhotoPath = `/Photo(photoType=1,userId='${sUserId}')`;
            const sJobHistoryPath = "/EmpJob";

            // 현재 언어 설정 가져오기 (예: ko-KR -> ko_KR)
            const sLocale = sap.ui.getCore().getConfiguration().getLanguage().replace("-", "_");

            const oJobHistoryParams = {
                "$filter": `userId eq '${sUserId}'`,
                "$expand": "eventNav/picklistLabels,eventReasonNav/nameTranslationNav,managerUserNav,companyNav,departmentNav,businessUnitNav,divisionNav,locationNav,positionNav,payGradeNav",
                "$select": "userId,startDate,seqNumber,event,eventReason,company,department,jobTitle,payGrade,fte,notes,jobCode,businessUnit,division,location,position," +
                           "eventNav/id,eventNav/picklistLabels/label,eventNav/picklistLabels/locale," +
                           "eventReasonNav/externalCode,eventReasonNav/nameTranslationNav," +
                           `companyNav/name,companyNav/name_localized,companyNav/name_${sLocale},` +
                           `departmentNav/name,departmentNav/name_localized,departmentNav/name_${sLocale},` +
                           `positionNav/externalName_localized,positionNav/externalName_${sLocale},positionNav/externalName_defaultValue,` +
                           "businessUnitNav/name,divisionNav/name,locationNav/name,payGradeNav/name," +
                           "managerUserNav/displayName",
                "$orderby": "startDate desc",
                "fromDate": "1999-01-01"
            };

            const fnReadPromise = (sReadPath, oUrlParams) => {
                return new Promise((resolve, reject) => {
                    oModel.read(sReadPath, {
                        urlParameters: oUrlParams || {},
                        success: (oData) => resolve(oData),
                        error: (oError) => reject(oError)
                    });
                });
            };

            // 모든 데이터 로드 대기
            Promise.all([
                fnReadPromise(sPath),
                fnReadPromise(sPhotoPath),
                fnReadPromise(sJobHistoryPath, oJobHistoryParams)
            ]).then(([oUserData, oPhotoData, oJobHistory]) => {
                // 데이터 바인딩
                this.getView().bindElement(sPath);
                
                // 이력 데이터 정렬 (최신순) 및 저장
                const aHistory = oJobHistory.results || [];

                // 레이블 사전 처리 (다국어 및 상세 정보 대응)
                aHistory.forEach((oJob) => {
                    oJob.eventText = this._getLabel(oJob.eventNav, oJob.event);
                    oJob.eventReasonText = this._getLabel(oJob.eventReasonNav, oJob.eventReason);
                    oJob.companyText = this._getLabel(oJob.companyNav, oJob.company);
                    oJob.departmentText = this._getLabel(oJob.departmentNav, oJob.department);
                    oJob.businessUnitText = this._getLabel(oJob.businessUnitNav, oJob.businessUnit);
                    oJob.divisionText = this._getLabel(oJob.divisionNav, oJob.division);
                    oJob.locationText = this._getLabel(oJob.locationNav, oJob.location);
                    oJob.positionText = this._getLabel(oJob.positionNav, oJob.position);
                    oJob.payGradeText = this._getLabel(oJob.payGradeNav, oJob.payGrade);
                });

                aHistory.sort((a, b) => {
                    return new Date(b.startDate) - new Date(a.startDate);
                });
                oViewModel.setProperty("/jobHistory", aHistory);

                // 사진 처리
                if (oPhotoData && oPhotoData.photo) {
                    oViewModel.setProperty("/photoUrl", `data:image/jpeg;base64,${oPhotoData.photo}`);
                }
            }).catch((oError) => {
                console.error("Data Load Error:", oError);
            }).finally(() => {
                // 로딩 완료
                oViewModel.setProperty("/busy", false);
            });
        },

        /**
         * SuccessFactors Navigation 객체에서 현재 언어에 맞는 레이블을 추출
         * @param {object} oNav Navigation 속성 객체 (eventNav 또는 eventReasonNav)
         * @param {string} sCode 항목의 코드값
         * @returns {string} 명칭 (코드)
         */
        _getLabel(oNav, sCode) {
            if (!sCode) return "";
            if (!oNav) return sCode;

            const sLocale = sap.ui.getCore().getConfiguration().getLanguage().replace("-", "_");
            let aResults = [];

            // 1. Picklist 구조 처리 (예: eventNav)
            if (oNav.picklistLabels && oNav.picklistLabels.results) {
                aResults = oNav.picklistLabels.results;
                const oMatch = aResults.find(item => item.locale === sLocale) ||
                               aResults.find(item => item.locale === "en_US") ||
                               aResults[0];
                return oMatch ? `${oMatch.label} (${sCode})` : sCode;
            }

            // 2. Foundation Object Translation 객체 처리 (예: eventReasonNav)
            if (oNav.nameTranslationNav) {
                const oTrans = oNav.nameTranslationNav;
                const sText = oTrans["value_" + sLocale] || oTrans.value_en_US || oTrans.value_localized || oTrans.value_defaultValue;
                return sText ? `${sText} (${sCode})` : sCode;
            }

            // 3. MDF 객체 직접 속성 처리 (예: positionNav)
            // MDF는 externalName_... 구조를 사용함
            const sMdfText = oNav["externalName_" + sLocale] || oNav.externalName_localized || oNav.externalName_en_US || oNav.externalName_defaultValue;
            if (sMdfText) {
                return `${sMdfText} (${sCode})`;
            }

            // 4. FO 직접 속성 다국어 처리 (예: companyNav, departmentNav)
            // FO는 name_... 구조를 사용함
            const sDirectText = oNav["name_" + sLocale] || oNav.name_localized || oNav.name_en_US || oNav.name;
            if (sDirectText) {
                return `${sDirectText} (${sCode})`;
            }

            // 2. Fallback: 번역 데이터가 없을 경우 기본 name 또는 description 사용
            const sName = oNav.name || oNav.description || sCode;
            return sName ? `${sName} (${sCode})` : sCode;
        },

        onJobHistoryPress(oEvent) {
            const oView = this.getView();
            const oContext = oEvent.getSource().getBindingContext("view");

            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "project1.view.JobDetailDialog",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pDialog.then((oDialog) => {
                oDialog.setBindingContext(oContext, "view");
                oDialog.open();
            });
        },

        onCloseDialog() {
            this.byId("jobDetailDialog").close();
        }
    });
});