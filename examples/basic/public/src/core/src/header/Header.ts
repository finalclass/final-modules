/// <reference path="../d.ts"/>

module core {

  export class Header {

    public html:string;

    constructor() {
      this.html = core.html['header'];
    }

  }

}