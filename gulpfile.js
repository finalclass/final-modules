var gulp = require('gulp');
var tsc = require('gulp-tsc');

gulp.task('default', ['compile', 'watch']);

gulp.task('watch', function () {
  gulp.watch('src/**/*.ts', ['compile']);
});

gulp.task('compile', function () {
  return gulp.src('src/**/*.ts')
    .pipe(tsc({
      emitError:false,
      module: 'commonjs',
      target: 'ES5',
      declaration: true
    }))
    .pipe(gulp.dest('build'));
});
