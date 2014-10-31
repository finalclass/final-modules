/// <reference path="../d.ts"/>
/// <reference path="../mainMenu/MainMenu.ts"/>

module app {

  export class Application {

    private mainMenu:MainMenu;
    private header:core.Header;
    private footer:core.Footer;

    constructor() {
      this.mainMenu = new MainMenu();
      this.header = new core.Header();
      this.footer = new core.Footer();

      window.onload = () => {
        var body:HTMLBodyElement = document.getElementsByTagName('body')[0];
        body.innerHTML = this.header.html + this.mainMenu.html + this.footer.html;
      };
    }

  }
}