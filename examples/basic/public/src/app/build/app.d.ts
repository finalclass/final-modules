/// <reference path="../../core/build/core.d.ts" />
declare module app {
    var html: {
        [x: string]: string;
    };
}
declare module app {
    class MainMenu {
        html: string;
        constructor();
    }
}
declare module app {
    class Application {
        private mainMenu;
        private header;
        private footer;
        constructor();
    }
}
