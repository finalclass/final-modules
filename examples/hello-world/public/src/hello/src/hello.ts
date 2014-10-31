declare module hello {
  var html:{[id:string]:string};
}

module hello {
  window.onload = function () {
    var body:HTMLBodyElement = document.getElementsByTagName('body')[0];
    body.innerHTML = hello.html['hello'];
  };
}
