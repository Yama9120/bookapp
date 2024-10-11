import gulp from 'gulp';
import ejs from 'gulp-ejs';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import imagemin from 'gulp-imagemin';
import { mkdirp } from 'mkdirp';
import file from 'gulp-file';

// dist/images ディレクトリが存在しない場合は作成する
gulp.task('create-images-dir', function (done) {
  mkdirp('dist/images', function (err) {
    if (err) {
      console.error(err);
      done(err);  // エラーがあれば報告
    } else {
      done();  // 成功時
    }
  });
});

// ejsのタスクの前に create-images-dir を実行する
gulp.task('ejs', gulp.series('create-images-dir', function () {
  return gulp.src('src/ejs/**/*.ejs')
    .pipe(ejs())
    .pipe(gulp.dest('dist'));
}));

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
gulp.task('images', function (done) {
  return gulp.src('public/images/**/*')
    .pipe(gulp.dest('dist/images'))
    .on('error', function (err) {
      console.log("No images found, skipping task.");
      done();
    });
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

gulp.task('nojekyll', function() {
  return file('.nojekyll', '', { src: true })
    .pipe(gulp.dest('dist'));
});

// デフォルトタスク
gulp.task('build', gulp.series('ejs', 'scripts', 'styles', 'images', 'copy', 'nojekyll'));