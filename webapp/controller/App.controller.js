sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/Device",
    "sap/ui/core/Fragment"
], function (Controller, Device, Fragment) {
    "use strict";

    return Controller.extend("project1.controller.App", {
        onInit: function () {
        },

        onMenuButtonPress: function (oEvent) {
            const oButton = oEvent.getSource();
            const oView = this.getView();

            if (!this._pMenuPopover) {
                this._pMenuPopover = Fragment.load({
                    id: oView.getId(),
                    name: "project1.view.MenuPopover",
                    controller: this
                }).then((oPopover) => {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }

            this._pMenuPopover.then((oPopover) => {
                oPopover.openBy(oButton);
            });
        },

        onThemeToggle: function () {
            const oConfiguration = sap.ui.getCore().getConfiguration();
            const sCurrentTheme = oConfiguration.getTheme();
            const sNewTheme = sCurrentTheme.indexOf("dark") !== -1 ? "sap_horizon" : "sap_horizon_dark";
            sap.ui.getCore().applyTheme(sNewTheme);
        },

        onAvatarPress: function (oEvent) {
            const oAvatar = oEvent.getSource();
            const oView = this.getView();

            if (!this._pUserInfoPopover) {
                this._pUserInfoPopover = Fragment.load({
                    id: oView.getId(),
                    name: "project1.view.UserInfoPopover",
                    controller: this
                }).then((oPopover) => {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }

            this._pUserInfoPopover.then((oPopover) => {
                oPopover.openBy(oAvatar);
            });
        }
    });
});