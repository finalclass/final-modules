var hello;
(function (hello) {
    window.onload = function () {
        var body = document.getElementsByTagName('body')[0];
        body.innerHTML = hello.html['hello'];
    };
})(hello || (hello = {}));
//# sourceMappingURL=hello.js.map