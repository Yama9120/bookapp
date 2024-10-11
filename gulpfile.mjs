import gulp from 'gulp';
import ejs from 'gulp-ejs';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import { mkdirp } from 'mkdirp';
import file from 'gulp-file';
import replace from 'gulp-replace';
import gulpIf from 'gulp-if';

// GitHub PagesのベースURL
const baseUrl = '/bookapp/';

// dist/images ディレクトリが存在しない場合は作成する
gulp.task('create-images-dir', async function () {
  try {
    await mkdirp('dist/images');
    console.log('dist/images directory created successfully');
  } catch (err) {
    console.error('Error creating dist/images directory:', err);
    throw err;
  }
});

// EJSファイルをHTMLに変換
gulp.task('ejs', function() {
  return gulp.src(['views/pages/*.ejs', 'views/*.ejs'])
    .pipe(ejs({
      baseUrl: baseUrl,
      bookId: 'placeholder'
    }, {}, { ext: '.html' }))
    .pipe(rename({ extname: '.html' }))
    // ベースURLが設定されている場合のみ、置換を行う
    // .pipe(gulpIf(!!baseUrl, replace(/href="(\/|\.\/)/g, `href="${baseUrl}`)))
    // .pipe(gulpIf(!!baseUrl, replace(/src="(\/|\.\/)/g, `src="${baseUrl}`)))
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
    .pipe(replace(/url\(\//g, `url(${baseUrl}`))
    .pipe(gulp.dest('dist/styles'));
});

// 画像の最適化
gulp.task('images', function () {
  return gulp.src('public/images/**/*')
    .pipe(gulp.dest('dist/images'))
    .on('error', function (err) {
      console.log("No images found or error occurred:", err);
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

// .nojekyllファイルの作成
gulp.task('nojekyll', function() {
  return file('.nojekyll', '', { src: true })
    .pipe(gulp.dest('dist'));
});

// ビルドタスク
gulp.task('build', gulp.series('create-images-dir', 'ejs', 'scripts', 'styles', 'images', 'copy', 'nojekyll'));

// 監視タスク
gulp.task('watch', function() {
  gulp.watch('views/**/*.ejs', gulp.series('ejs'));
  gulp.watch('public/scripts/*.js', gulp.series('scripts'));
  gulp.watch('public/styles/*.css', gulp.series('styles'));
  gulp.watch('public/images/*', gulp.series('images'));
});

// デフォルトタスク
gulp.task('default', gulp.series('build'));