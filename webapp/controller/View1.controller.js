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

            const oModel = this.getOwnerComponent().getModel();
            // 데이터 정확성 확인을 위해 Batch 모드 비활성화
            oModel.setUseBatch(false);

            const sUserId = "sfadmin";
            const sPath = `/User('${sUserId}')`;
            const sPhotoPath = `/Photo(photoType=1,userId='${sUserId}')`;
            const sJobHistoryPath = `/EmpJob`;

            const oUserParams = {};

            const oJobHistoryParams = {
                "$filter": `userId eq '${sUserId}'`,
                "$expand": "eventNav/picklistLabels,eventReasonNav,managerUserNav",
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
                fnReadPromise(sPath, oUserParams),
                fnReadPromise(sPhotoPath),
                fnReadPromise(sJobHistoryPath, oJobHistoryParams)
            ]).then(([oUserData, oPhotoData, oJobHistory]) => {
                // 데이터 바인딩
                this.getView().bindElement(sPath);
                
                // 이력 데이터 정렬 (최신순) 및 저장
                const aHistory = oJobHistory.results || [];
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