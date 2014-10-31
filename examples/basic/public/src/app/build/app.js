/// <reference path="../../core/build/core.d.ts"/>
/// <reference path="../d.ts"/>
var app;
(function (app) {
    var MainMenu = (function () {
        function MainMenu() {
            this.html = app.html['mainMenu'];
        }
        return MainMenu;
    })();
    app.MainMenu = MainMenu;
})(app || (app = {}));
/// <reference path="../d.ts"/>
/// <reference path="../mainMenu/MainMenu.ts"/>
var app;
(function (app) {
    var Application = (function () {
        function Application() {
            var _this = this;
            this.mainMenu = new app.MainMenu();
            this.header = new core.Header();
            this.footer = new core.Footer();
            window.onload = function () {
                var body = document.getElementsByTagName('body')[0];
                body.innerHTML = _this.header.html + _this.mainMenu.html + _this.footer.html;
            };
        }
        return Application;
    })();
    app.Application = Application;
})(app || (app = {}));
//# sourceMappingURL=app.js.map