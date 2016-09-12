var gulp = require('gulp');
var sass = require('gulp-sass');
var cssnano = require('gulp-cssnano');
var gulpif = require('gulp-if');
var autoprefixer = require('gulp-autoprefixer');
var rename = require('gulp-rename');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var sequence = require('gulp-sequence');
var babel = require('gulp-babel');

gulp.task('css', function() {
    return gulp.src('src/sass/*.scss')
        .pipe(sass())
        .pipe(autoprefixer({browsers: ['>1%', 'last 5 versions']}))
        .pipe(gulp.dest('dist/css'))
        .pipe(cssnano())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('js', function () {
    return gulp.src('src/js/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist/js'))
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('clean', function() {
    return gulp.src('dist', {read: false})
        .pipe(clean());
});

gulp.task('watch', function() {
    gulp.watch('src/sass/*.scss', ['css']);
    gulp.watch('src/js/*.js', ['js']);
});

gulp.task('build', sequence('clean', ['css', 'js']));
gulp.task('default', sequence('build', 'watch'));