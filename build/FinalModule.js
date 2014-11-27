var FinalModule = (function () {
    function FinalModule(name, deps) {
        this.name = name;
        this.deps = deps;
    }
    FinalModule.prototype.getDeps = function (prefix, suffix) {
        return this.deps.map(function (dep) { return prefix + dep + suffix; });
    };
    return FinalModule;
})();
module.exports = FinalModule;
