var gulp = require('gulp');
var sass = require('gulp-sass');

var input = './public/scss/**/*.scss';
var output = './public/css';

gulp.task('scss', function () {
  return gulp
    .src(input)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(output));
});

gulp.task('scss:watch', function(){
  gulp.watch(input,['scss']);
});
