import gulp from 'gulp';
import ejs from 'gulp-ejs';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import imagemin from 'gulp-imagemin';

// EJSファイルをHTMLに変換
gulp.task('ejs', function() {
  return gulp.src(['views/pages/*.ejs', 'views/*.ejs'])
    .pipe(ejs({
      // EJSに渡すデータをここに記述
      bookId: 'placeholder' // または適切なデフォルト値
    }, {}, { ext: '.html' }))
    .pipe(rename({ extname: '.html' }))
    .pipe(gulp.dest('dist'));
});

// JavaScriptファイルの処理
gulp.task('scripts', function() {
  return gulp.src('public/scripts/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/scripts'));
});

// CSSファイルの処理
gulp.task('styles', function() {
  return gulp.src('public/styles/*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist/styles'));
});

// 画像の最適化
gulp.task('images', function() {
  return gulp.src('public/images/*')
    .pipe(imagemin())
    .pipe(gulp.dest('dist/images'));
});

// その他のファイルのコピー
gulp.task('copy', function() {
  return gulp.src([
    'public/**/*',
    '!public/scripts/**',
    '!public/styles/**',
    '!public/images/**'
  ])
  .pipe(gulp.dest('dist'));
});

// ビルドタスク
gulp.task('build', gulp.series('ejs', 'scripts', 'styles', 'images', 'copy'));

// 監視タスク
gulp.task('watch', function() {
  gulp.watch('views/**/*.ejs', gulp.series('ejs'));
  gulp.watch('public/scripts/*.js', gulp.series('scripts'));
  gulp.watch('public/styles/*.css', gulp.series('styles'));
  gulp.watch('public/images/*', gulp.series('images'));
});

// デフォルトタスク
gulp.task('default', gulp.series('build', 'watch'));