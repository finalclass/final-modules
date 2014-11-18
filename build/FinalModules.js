/// <reference path="typings/tsd.d.ts"/>
var FinalModule = require('./FinalModule');
var path = require('path');
var fs = require('fs');
var DependencyResolver = require('dependency-resolver');
var wrap = require('gulp-wrap');
var concat = require('gulp-concat');
var tsc = require('gulp-tsc');
var uglify = require('gulp-uglifyjs');
var stylus = require('gulp-stylus');
var nib = require('nib');
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence');
var FinalModules = (function () {
    function FinalModules(modulesPath) {
        if (modulesPath === void 0) { modulesPath = 'public/src'; }
        this.modulesPath = modulesPath;
        this.modules = {};
        this.modulesInverted = new DependencyResolver();
    }
    FinalModules.prototype.add = function (name, dependencies) {
        var _this = this;
        if (dependencies === void 0) { dependencies = []; }
        this.modules[name] = new FinalModule(name, dependencies);
        this.modulesInverted.add(name);
        dependencies.forEach(function (dep) {
            _this.modulesInverted.setDependency(dep, name);
        });
    };
    FinalModules.prototype.map = function (func) {
        var _this = this;
        return Object.keys(this.modules).map(function (key) { return func(_this.modules[key]); });
    };
    FinalModules.prototype.generateTasks = function (gulp) {
        var _this = this;
        this.sequence = runSequence.use(gulp);
        this.map(function (mod) {
            gulp.task(mod.name + ':html', _this.getHtmlTask(gulp, mod));
            gulp.task(mod.name + ':ts', mod.getDepsWithSuffix(':ts'), _this.getTsTask(gulp, mod));
            gulp.task(mod.name + ':ts:standalone', _this.getTsTask(gulp, mod));
            gulp.task(mod.name + ':min', [mod.name + ':ts'], _this.getMinTask(gulp, mod));
            console.log('######', mod.name + ':min:standalone');
            gulp.task(mod.name + ':min:standalone', [mod.name + ':ts:standalone'], _this.getMinTask(gulp, mod));
            gulp.task(mod.name + ':styl', _this.getStylTask(gulp, mod));
            gulp.task(mod.name + ':watch:ts', _this.getWatchTsTask(gulp, mod));
            gulp.task(mod.name + ':watch:styl', _this.getWatchStylTask(gulp, mod));
            gulp.task(mod.name + ':watch:html', _this.getWatchHtmlTask(gulp, mod));
            gulp.task(mod.name + ':watch', [mod.name + ':watch:ts', mod.name + ':watch:styl', mod.name + ':watch:html']);
        });
        gulp.task('fm:html', this.map(function (mod) { return mod.name + ':html'; }));
        gulp.task('fm:ts', this.map(function (mod) { return mod.name + ':ts'; }));
        gulp.task('fm:min', this.map(function (mod) { return mod.name + ':min'; }));
        gulp.task('fm:styl', this.map(function (mod) { return mod.name + ':styl'; }));
        gulp.task('fm:watch:ts', this.map(function (mod) { return mod.name + ':watch:ts'; }));
        gulp.task('fm:watch:styl', this.map(function (mod) { return mod.name + ':watch:styl'; }));
        gulp.task('fm:watch:html', this.map(function (mod) { return mod.name + ':watch:html'; }));
        gulp.task('fm:watch', ['fm:watch:ts', 'fm:watch:styl', 'fm:watch:html']);
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
    FinalModules.prototype.getWatchTsTask = function (gulp, mod) {
        var _this = this;
        return function () {
            gulp.watch(_this.modulesPath + '/' + mod.name + '/src/**/*.ts', function () {
                var tasks = _this.modulesInverted.resolve(mod.name).reverse().map(function (m) { return m + ':min:standalone'; });
                _this.sequence.apply(_this.sequence, tasks);
            });
        };
    };
    FinalModules.prototype.getWatchStylTask = function (gulp, mod) {
        var _this = this;
        return function () {
            gulp.watch(_this.modulesPath + '/' + mod.name + '/src/**/*.styl', [mod.name + ':styl']);
        };
    };
    FinalModules.prototype.getWatchHtmlTask = function (gulp, mod) {
        var _this = this;
        return function () {
            gulp.watch(_this.modulesPath + '/' + mod.name + '/src/**/*.html', [mod.name + ':html']);
        };
    };
    FinalModules.prototype.getStylTask = function (gulp, mod) {
        var _this = this;
        return function () {
            return gulp.src([_this.modulesPath + '/' + mod.name + '/src/**/*.styl']).pipe(stylus({
                use: nib(),
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
            var inSourceMapPath = _this.modulesPath + '/' + mod.name + '/build/' + mod.name + '.js.map';
            return gulp.src([_this.modulesPath + '/' + mod.name + '/build/' + mod.name + '.js']).pipe(uglify(mod.name + '.min.js', {
                outSourceMap: true,
                output: {
                    source_map: {
                        file: mod.name + '.min.js',
                        root: '',
                        orig: fs.readFileSync(inSourceMapPath).toString()
                    }
                }
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
                sourceRoot: '',
                declaration: true,
                out: mod.name + '.js'
            })).pipe(gulp.dest(outDir));
        };
    };
    FinalModules.prototype.getHtmlTask = function (gulp, mod) {
        var _this = this;
        return function () {
            var modNameSplit = mod.name.split('.');
            var modVarInit;
            var nameAlready = modNameSplit[0];
            modVarInit = 'var $name = $name || {};'.replace(/\$name/g, nameAlready);
            for (var i = 1; i < modNameSplit.length; i += 1) {
                nameAlready += '.' + modNameSplit[i];
                modVarInit += '\n$name = $name || {};'.replace(/\$name/g, nameAlready);
            }
            return gulp.src(_this.modulesPath + '/' + mod.name + '/src/**/*.html').pipe(wrap('<%=mod.name%>.html.<%= varName(file.path) %> = \'<%=escape(contents)%>\';', {
                mod: mod,
                varName: FinalModules.varNameFilter,
                escape: FinalModules.escapeString
            })).pipe(concat(mod.name + '.html.js')).pipe(wrap(modVarInit + '\n<%=mod.name%>.html = {};\n\n<%=contents%>', { mod: mod })).pipe(gulp.dest(_this.modulesPath + '/' + mod.name + '/build'));
        };
    };
    return FinalModules;
})();
module.exports = FinalModules;
