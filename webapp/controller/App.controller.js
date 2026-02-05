sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/Device"
], function (Controller, Device) {
    "use strict";

    return Controller.extend("project1.controller.App", {
        onInit: function () {
            // 모바일인 경우 초기 상태에서 사이드 메뉴를 숨깁니다.
            if (Device.system.phone) {
                this.byId("toolPage").setSideExpanded(false);
            }
        },

        onSideNavButtonPress: function () {
            var oToolPage = this.byId("toolPage");
            var bSideExpanded = oToolPage.getSideExpanded();
            oToolPage.setSideExpanded(!bSideExpanded);
        }
    });
});