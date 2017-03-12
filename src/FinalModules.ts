/// <reference path="typings/tsd.d.ts"/>

import FinalModule = require('./FinalModule');
import IGulp = require('./IGulp');
import path = require('path');
import fs = require('fs');
import DependencyResolver = require('dependency-resolver');

var wrap: (...args: any[]) => any = require('gulp-wrap');
var concat: (...args: any[]) => any = require('gulp-concat');
var tsc: (...args: any[]) => any = require('gulp-tsc');
var uglify: (...args: any[]) => any = require('gulp-uglifyjs');
var stylus: (...args: any[]) => any = require('gulp-stylus');
var nib: (...args: any[]) => any = require('nib');
var plumber: (...args: any[]) => any = require('gulp-plumber');
var sourcemaps: any = require('gulp-sourcemaps');
var runSequence: (...args: any[]) => any = require('run-sequence');
var clean: any = require('gulp-clean');

class FinalModules {

    private modules: { [name: string]: FinalModule } = {};
    private modulesInverted: DependencyResolver;
    private sequence: (...args: any[]) => any

    constructor(private modulesPath: string = 'public/src') {
        this.modulesInverted = new DependencyResolver();
    }

    public add(name: string, dependencies: string[] = []): void {
        this.modules[name] = new FinalModule(name, dependencies);
        this.modulesInverted.add(name);
        dependencies.forEach((dep: string): void => {
            this.modulesInverted.setDependency(dep, name);
        });
    }

    private map<T>(func: (mod: FinalModule) => T): T[] {
        return Object.keys(this.modules).map((key: string): T => func(this.modules[key]));
    }

    public generateTasks(gulp: IGulp.Gulp): void {
        this.sequence = (<any>runSequence).use(gulp);

        //Check for circular dependencies:
        //sort() method will throw an error on circular dependencies
        this.modulesInverted.sort();

        this.map((mod: FinalModule): void => {
            gulp.task('fm:' + mod.name + ':html', this.getHtmlTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':ts', mod.getDeps('fm:', ':ts'), this.getTsTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':ts:standalone', this.getTsTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':min', ['fm:' + mod.name + ':ts'], this.getMinTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':min:standalone', ['fm:' + mod.name + ':ts:standalone'], this.getMinTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':styl', this.getStylTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':clean', this.getCleanTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':watch:ts', this.getWatchTsTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':watch:styl', this.getWatchStylTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':watch:html', this.getWatchHtmlTask(gulp, mod));
            gulp.task('fm:' + mod.name + ':watch', [mod.name + ':watch:ts', mod.name + ':watch:styl', mod.name + ':watch:html']);
        });

        gulp.task('fm:html', this.map((mod: FinalModule): string => 'fm:' + mod.name + ':html'));
        gulp.task('fm:ts', this.map((mod: FinalModule): string => 'fm:' + mod.name + ':ts'));
        gulp.task('fm:min', this.map((mod: FinalModule): string => 'fm:' + mod.name + ':min'));
        gulp.task('fm:styl', this.map((mod: FinalModule): string => 'fm:' + mod.name + ':styl'));
        gulp.task('fm:clean', this.map((mod: FinalModule): string => 'fm:' + mod.name + ':clean'));
        gulp.task('fm:watch:ts', this.map((mod: FinalModule): string => 'fm:' + mod.name + ':watch:ts'));
        gulp.task('fm:watch:styl', this.map((mod: FinalModule): string => 'fm:' + mod.name + ':watch:styl'));
        gulp.task('fm:watch:html', this.map((mod: FinalModule): string => 'fm:' + mod.name + ':watch:html'));
        gulp.task('fm:watch', ['fm:watch:ts', 'fm:watch:styl', 'fm:watch:html']);
        gulp.task('fm', ['fm:styl', 'fm:min', 'fm:html', 'fm:watch']);
    }

    private static varNameFilter(filePath: string): string {
        return path.basename(filePath, '.html')
            .replace(/[^a-zA-Z0-9\_\.]+/g, '-')
            .replace(/-([a-z])/g, function(g) {
                return g[1].toUpperCase();
            })
            .replace(/\-+/g, '');
    }

    private static escapeString(text: string): string {
        return text
            .replace(/\n/g, '')
            .replace(/\'/g, '\\\'');
    }

    private getWatchTsTask(gulp: IGulp.Gulp, mod: FinalModule): () => void {
        return (): void => {
            gulp.watch(this.modulesPath + '/' + mod.name + '/src/**/*.ts', (): void => {
                var tasks: string[] = this.modulesInverted.resolve(mod.name)
                    .reverse()
                    .map((m: string): string => 'fm:' + m + ':min:standalone');
                this.sequence.apply(this.sequence, tasks);
            });
        };
    }

    private getCleanTask(gulp: IGulp.Gulp, mod: FinalModule): () => NodeJS.ReadWriteStream {
        return (): NodeJS.ReadWriteStream => {
            return gulp
                .src(this.modulesPath + '/' + mod.name + '/build', { read: false })
                .pipe(clean());
        };
    }

    private getWatchStylTask(gulp: IGulp.Gulp, mod: FinalModule): () => void {
        return (): void => {
            gulp.watch(this.modulesPath + '/' + mod.name + '/src/**/*.styl', ['fm:' + mod.name + ':styl']);
        };
    }

    private getWatchHtmlTask(gulp: IGulp.Gulp, mod: FinalModule): () => void {
        return (): void => {
            gulp.watch(this.modulesPath + '/' + mod.name + '/src/**/*.html', ['fm:' + mod.name + ':html']);
        };
    }

    private getStylTask(gulp: IGulp.Gulp, mod: FinalModule): () => NodeJS.ReadWriteStream {
        return (): NodeJS.ReadWriteStream => {
            return gulp.src([this.modulesPath + '/' + mod.name + '/src/**/*.styl'])
                .pipe(plumber())
                .pipe(stylus({
                    use: nib(),
                    sourcemap: {
                        inline: true,
                        sourceRoot: '',
                        basePath: 'css'
                    }
                }))
                .pipe(sourcemaps.init({
                    loadMaps: true
                }))
                .pipe(concat(mod.name + '.css'))
                .pipe(sourcemaps.write('.', {
                    includeConent: false,
                    sourceRoot: ''
                }))
                .pipe(gulp.dest(this.modulesPath + '/' + mod.name + '/build/'));
        };
    }

    private getMinTask(gulp: IGulp.Gulp, mod: FinalModule): () => NodeJS.ReadWriteStream {
        return (): NodeJS.ReadWriteStream => {

            var inSourceMapPath: string = this.modulesPath + '/'
                + mod.name + '/build/' + mod.name + '.js.map';

            return gulp.src([this.modulesPath + '/' + mod.name + '/build/' + mod.name + '.js'])
                .pipe(uglify(mod.name + '.min.js', {
                    outSourceMap: true,
                    output: {
                        source_map: {
                            file: mod.name + '.min.js',
                            root: '',
                            orig: fs.readFileSync(inSourceMapPath).toString()
                        }
                    }
                }))
                .pipe(gulp.dest(this.modulesPath + '/' + mod.name + '/build/'));
        };
    }

    private getTsTask(gulp: IGulp.Gulp, mod: FinalModule): () => NodeJS.ReadWriteStream {
        return (): NodeJS.ReadWriteStream => {
            var outDir = this.modulesPath + '/' + mod.name + '/build';

            return gulp.src([
                this.modulesPath + '/' + mod.name + '/src/**/*.ts',
                '!' + this.modulesPath + '/' + mod.name + '/src/**/*.d.ts'
            ])
                .pipe(tsc({
                    emitError: false,
                    module: 'amd',
                    target: 'ES5',
                    outDir: outDir,
                    sourcemap: true,
                    sourceRoot: '',
                    declaration: true,
                    out: mod.name + '.js',
                    rootDir: this.modulesPath
                }))
                .pipe(gulp.dest(outDir));
        };
    }

    private getHtmlTask(gulp: IGulp.Gulp, mod: FinalModule): () => NodeJS.ReadWriteStream {
        return (): NodeJS.ReadWriteStream => {
            var modNameSplit: string[] = mod.name.split('.');
            var modVarInit: string;

            var nameAlready: string = modNameSplit[0];
            modVarInit = 'var $name = $name || {};'.replace(/\$name/g, nameAlready);

            for (var i = 1; i < modNameSplit.length; i += 1) {
                nameAlready += '.' + modNameSplit[i];
                modVarInit += '\n$name = $name || {};'.replace(/\$name/g, nameAlready);
            }

            return gulp.src(this.modulesPath + '/' + mod.name + '/src/**/*.html')
                .pipe(wrap('<%=mod.name%>.html.<%= varName(file.path) %> = \'<%=escape(contents)%>\';', {
                    mod: mod,
                    varName: FinalModules.varNameFilter,
                    escape: FinalModules.escapeString
                }))
                .pipe(concat(mod.name + '.html.js'))
                .pipe(wrap(
                    modVarInit + '\n<%=mod.name%>.html = {};\n\n<%=contents%>',
                    { mod: mod }
                ))
                .pipe(gulp.dest(this.modulesPath + '/' + mod.name + '/build'));
        };
    }
}

export = FinalModules;
