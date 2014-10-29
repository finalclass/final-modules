/// <reference path="typings/tsd.d.ts"/>

import FinalModule = require('./FinalModule');
import IGulp = require('./IGulp');
import path = require('path');
var wrap:(...args:any[])=>any = require('gulp-wrap');
var concat:(...args:any[])=>any = require('gulp-concat');
var tsc:(...args:any[])=>any = require('gulp-tsc');
var uglify:(...args:any[])=>any = require('gulp-uglifyjs');
var stylus:(...args:any[])=>any = require('gulp-stylus');
var nib:(...args:any[])=>any = require('nib');
var sourcemaps:any = require('gulp-sourcemaps');

class FinalModules {

  private modules:{[name:string]:FinalModule} = {};

  constructor(private modulesPath:string = 'public/src') {

  }

  public add(name:string, dependencies:string[] = []):void {
    this.modules[name] = new FinalModule(name, dependencies);
  }

  private map<T>(func:(mod:FinalModule)=>T):T[] {
    return Object.keys(this.modules).map((key:string):T => func(this.modules[key]));
  }

  public generateTasks(gulp:IGulp.Gulp):void {
    this.map((mod:FinalModule):void => {
      gulp.task(mod.name + ':html', this.getHtmlTask(gulp, mod));
      gulp.task(mod.name + ':ts', mod.getDepsWithSuffix(':ts'), this.getTsTask(gulp, mod));
      gulp.task(mod.name + ':min', [mod.name + ':ts'], this.getMinTask(gulp, mod));
      gulp.task(mod.name + ':styl', this.getStylTask(gulp, mod));
      gulp.task(mod.name + ':watch', this.getWatchTask(gulp, mod));
    });

    gulp.task('fm:html', this.map((mod:FinalModule):string => mod.name + ':html'));
    gulp.task('fm:ts', this.map((mod:FinalModule):string => mod.name + ':ts'));
    gulp.task('fm:min', this.map((mod:FinalModule):string => mod.name + ':min'));
    gulp.task('fm:styl', this.map((mod:FinalModule):string => mod.name + ':styl'));
    gulp.task('fm:watch', this.map((mod:FinalModule):string => mod.name + ':watch'));
    gulp.task('fm', ['fm:styl', 'fm:min', 'fm:html', 'fm:watch']);
  }

  private static varNameFilter(filePath:string):string {
    return path.basename(filePath, '.html')
      .replace(/[^a-zA-Z0-9\_\.]+/g, '-')
      .replace(/-([a-z])/g, function (g) {
        return g[1].toUpperCase();
      })
      .replace(/\-+/g, '');
  }

  private static escapeString(text:string):string {
    return text
      .replace(/\n/g, '')
      .replace(/\'/g, '\\\'');
  }

  private getWatchTask(gulp:IGulp.Gulp, mod:FinalModule):()=>void {
    return ():void => {
      gulp.watch(this.modulesPath + '/' + mod.name + '/src/**/*.ts', [mod.name + ':min']);
      gulp.watch(this.modulesPath + '/' + mod.name + '/src/**/*.html', [mod.name + ':html']);
      gulp.watch(this.modulesPath + '/' + mod.name + '/src/**/*.styl', [mod.name + ':styl']);
    };
  }

  private getStylTask(gulp:IGulp.Gulp, mod:FinalModule):()=>NodeJS.ReadWriteStream {
    return ():NodeJS.ReadWriteStream => {
      return gulp.src([this.modulesPath + '/' + mod.name + '/src/**/*.styl'])
        .pipe(stylus({
          use: [nib()],
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

  private getMinTask(gulp:IGulp.Gulp, mod:FinalModule):()=>NodeJS.ReadWriteStream {
    return ():NodeJS.ReadWriteStream => {
      return gulp.src([this.modulesPath + '/' + mod.name + '/build/' + mod.name + '.js'])
        .pipe(uglify(mod.name + '.min.js', {
          inSourceMap: this.modulesPath + '/' + mod.name + '/build/' + mod.name + '.js.map',
          outSourceMap: true
        }))
        .pipe(gulp.dest(this.modulesPath + '/' + mod.name + '/build/'));
    };
  }

  private getTsTask(gulp:IGulp.Gulp, mod:FinalModule):()=>NodeJS.ReadWriteStream {
    return ():NodeJS.ReadWriteStream => {
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
          declaration: true,
          out: mod.name + '.js'
        }))
        .pipe(gulp.dest(outDir));
    };
  }

  private getHtmlTask(gulp:IGulp.Gulp, mod:FinalModule):()=>NodeJS.ReadWriteStream {
    return ():NodeJS.ReadWriteStream => {
      return gulp.src(this.modulesPath + '/' + mod.name + '/src/**/*.html')
        .pipe(wrap('<%=mod.name%>.html.<%= varName(file.path) %> = \'<%=escape(contents)%>\';', {
          mod: mod,
          varName: FinalModules.varNameFilter,
          escape: FinalModules.escapeString
        }))
        .pipe(concat(mod.name + '.html.js'))
        .pipe(wrap(
          'var <%=mod.name + "=" + mod.name%> || {};\n<%=mod.name%>.html = {};\n\n<%=contents%>',
          {mod: mod}
        ))
        .pipe(gulp.dest(this.modulesPath + '/' + mod.name + '/build'));
    };
  }
}

export = FinalModules;
