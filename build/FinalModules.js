/// <reference path="typings/tsd.d.ts"/>
var FinalModule = require('./FinalModule');
var path = require('path');
var wrap = require('gulp-wrap');
var concat = require('gulp-concat');
var tsc = require('gulp-tsc');
var uglify = require('gulp-uglifyjs');
var stylus = require('gulp-stylus');
var nib = require('nib');
var sourcemaps = require('gulp-sourcemaps');
var FinalModules = (function () {
    function FinalModules(modulesPath) {
        if (modulesPath === void 0) { modulesPath = 'public/src'; }
        this.modulesPath = modulesPath;
        this.modules = {};
    }
    FinalModules.prototype.add = function (name, dependencies) {
        if (dependencies === void 0) { dependencies = []; }
        this.modules[name] = new FinalModule(name, dependencies);
    };
    FinalModules.prototype.map = function (func) {
        var _this = this;
        return Object.keys(this.modules).map(function (key) { return func(_this.modules[key]); });
    };
    FinalModules.prototype.generateTasks = function (gulp) {
        var _this = this;
        this.map(function (mod) {
            gulp.task(mod.name + ':html', _this.getHtmlTask(gulp, mod));
            gulp.task(mod.name + ':ts', mod.getDepsWithSuffix(':ts'), _this.getTsTask(gulp, mod));
            gulp.task(mod.name + ':min', [mod.name + ':ts'], _this.getMinTask(gulp, mod));
            gulp.task(mod.name + ':styl', _this.getStylTask(gulp, mod));
            gulp.task(mod.name + ':watch', _this.getWatchTask(gulp, mod));
        });
        gulp.task('fm:html', this.map(function (mod) { return mod.name + ':html'; }));
        gulp.task('fm:ts', this.map(function (mod) { return mod.name + ':ts'; }));
        gulp.task('fm:min', this.map(function (mod) { return mod.name + ':min'; }));
        gulp.task('fm:styl', this.map(function (mod) { return mod.name + ':styl'; }));
        gulp.task('fm:watch', this.map(function (mod) { return mod.name + ':watch'; }));
        gulp.task('fm', ['fm:styl', 'fm:min', 'fm:html', 'fm:watch']);
    };
    FinalModules.varNameFilter = function (filePath) {
        return path.basename(filePath, '.html').replace(/[^a-zA-Z0-9\_\.]+/g, '-').replace(/-([a-z])/g, function (g) {
            return g[1].toUpperCase();
        }).replace(/\-+/g, '');
    };
    FinalModules.escapeString = function (text) {
        return text.replace(/\n/g, '').replace(/\'/g, '\\\'');
    };
    FinalModules.prototype.getWatchTask = function (gulp, mod) {
        var _this = this;
        return function () {
            gulp.watch(_this.modulesPath + '/' + mod.name + '/src/**/*.ts', [mod.name + ':min']);
            gulp.watch(_this.modulesPath + '/' + mod.name + '/src/**/*.html', [mod.name + ':html']);
            gulp.watch(_this.modulesPath + '/' + mod.name + '/src/**/*.styl', [mod.name + ':styl']);
        };
    };
    FinalModules.prototype.getStylTask = function (gulp, mod) {
        var _this = this;
        return function () {
            return gulp.src([_this.modulesPath + '/' + mod.name + '/src/**/*.styl']).pipe(stylus({
                use: [nib()],
                sourcemap: {
                    inline: true,
                    sourceRoot: '',
                    basePath: 'css'
                }
            })).pipe(sourcemaps.init({
                loadMaps: true
            })).pipe(concat(mod.name + '.css')).pipe(sourcemaps.write('.', {
                includeConent: false,
                sourceRoot: ''
            })).pipe(gulp.dest(_this.modulesPath + '/' + mod.name + '/build/'));
        };
    };
    FinalModules.prototype.getMinTask = function (gulp, mod) {
        var _this = this;
        return function () {
            return gulp.src([_this.modulesPath + '/' + mod.name + '/build/' + mod.name + '.js']).pipe(uglify(mod.name + '.min.js', {
                inSourceMap: _this.modulesPath + '/' + mod.name + '/build/' + mod.name + '.js.map',
                outSourceMap: true
            })).pipe(gulp.dest(_this.modulesPath + '/' + mod.name + '/build/'));
        };
    };
    FinalModules.prototype.getTsTask = function (gulp, mod) {
        var _this = this;
        return function () {
            var outDir = _this.modulesPath + '/' + mod.name + '/build';
            return gulp.src([
                _this.modulesPath + '/' + mod.name + '/src/**/*.ts',
                '!' + _this.modulesPath + '/' + mod.name + '/src/**/*.d.ts'
            ]).pipe(tsc({
                emitError: false,
                module: 'amd',
                target: 'ES5',
                outDir: outDir,
                sourcemap: true,
                declaration: true,
                out: mod.name + '.js'
            })).pipe(gulp.dest(outDir));
        };
    };
    FinalModules.prototype.getHtmlTask = function (gulp, mod) {
        var _this = this;
        return function () {
            return gulp.src(_this.modulesPath + '/' + mod.name + '/src/**/*.html').pipe(wrap('<%=mod.name%>.html.<%= varName(file.path) %> = \'<%=escape(contents)%>\';', {
                mod: mod,
                varName: FinalModules.varNameFilter,
                escape: FinalModules.escapeString
            })).pipe(concat(mod.name + '.html.js')).pipe(wrap('var <%=mod.name + "=" + mod.name%> || {};\n<%=mod.name%>.html = {};\n\n<%=contents%>', { mod: mod })).pipe(gulp.dest(_this.modulesPath + '/' + mod.name + '/build'));
        };
    };
    return FinalModules;
})();
module.exports = FinalModules;
