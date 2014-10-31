var FinalModule = (function () {
    function FinalModule(name, deps) {
        this.name = name;
        this.deps = deps;
    }
    FinalModule.prototype.getDepsWithSuffix = function (suffix) {
        return this.deps.map(function (dep) { return dep + suffix; });
    };
    return FinalModule;
})();
module.exports = FinalModule;
