sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit() {
            const oViewModel = new JSONModel({
                busy: false,
                photoUrl: ""
            });
            this.getView().setModel(oViewModel, "view");

            const oModel = this.getOwnerComponent().getModel();
            const sUserId = "sfadmin";
            const sPath = `/User('${sUserId}')`;
            const sPhotoPath = `/Photo(photoType=1,userId='${sUserId}')`;

            // 1. 화면(View)에 데이터를 보여주기 위한 선언적 바인딩
            this.getView().bindElement({
                path: sPath
            });

            // 2. Photo 데이터 가져오기 (Base64 처리)
            oModel.read(sPhotoPath, {
                success: (oPhotoData) => {
                    if (oPhotoData && oPhotoData.photo) {
                        // SuccessFactors는 Binary 데이터를 base64 문자열로 반환합니다.
                        oViewModel.setProperty("/photoUrl", `data:image/jpeg;base64,${oPhotoData.photo}`);
                    }
                },
                error: (oError) => {
                    console.error("Photo Load Error:", oError);
                }
            });

            // 3. 데이터 로드 확인 및 로딩 상태 제어
            oViewModel.setProperty("/busy", true);
            oModel.read(sPath, {
                success: (oData) => {
                    console.log("User Data:", oData);
                    oViewModel.setProperty("/busy", false);
                },
                error: (oError) => {
                    console.error("Error:", oError);
                    oViewModel.setProperty("/busy", false);
                }
            });
        }
    });
});