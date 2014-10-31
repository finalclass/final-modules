var gulp = require('gulp');
var FinalModules = require('../../build/FinalModules.js');

var fm = new FinalModules('public/src');
fm.add('hello');
fm.generateTasks(gulp);

gulp.task('default', ['fm']);