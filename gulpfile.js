const { src, dest, parallel, series, watch } = require('gulp');

const browserSync = require('browser-sync').create(),
	concat = require('gulp-concat'),
	sass = require('gulp-sass')(require('sass')),
	autoprefixer = require('gulp-autoprefixer'),
	cleancss = require('gulp-clean-css'),
	clean = require('gulp-clean'),
	webpack = require('webpack-stream'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant');

function browsersync() {
	browserSync.init({ // Инициализация Browsersync
		server: { baseDir: 'dist/' }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true, // Режим работы: true или false
		port: 8000
	})
};

function html() {
	return src('app/*.html')
	.pipe(dest('dist/'))
	.pipe(browserSync.stream()); 
}

function js() {
	return src('app/js/app.js')
		.pipe(webpack({
			mode: 'production',
			output: {
				filename: 'app.min.js'
			},
			watch: false,
			module: {
				rules: [
					{
						test: /\.m?js$/,
						exclude: /(node_modules|bower_components)/,
						use: {
							loader: 'babel-loader',
							options: {
								presets: [['@babel/preset-env', {
									debug: true,
									corejs: 3,
									useBuiltIns: 'usage'
								}]]
							}
						}
					}
				]
			}
		}))
		.pipe(dest('dist/js/'))
		.on('end', browserSync.reload);
};

function styles() {
	return src('app/css/style.scss') // Выбираем источник
		.pipe(sass()) // Подключаем sass
		.pipe(concat('style.min.css')) // Конкатенируем в файл style.min.css
		.pipe(autoprefixer({ ovverideBrowserslist: ['last 10 versions'], grid: true })) // Создаем префиксы с помощью Autoprefixer
		.pipe(cleancss({ level: { 1: { specialComments: 0 } }, /* format: 'beautify' */ })) // Минифицируем стили
		.pipe(dest('dist/css/')) // Выгрузим результат в папку "app/css/"
		.pipe(browserSync.stream()); // Триггерим Browsersync для обновления страницы
};

function images() {
	return src('app/img/**/*', {base: 'app'})
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		}))
		.pipe(dest('dist/'))
		.pipe(browserSync.stream());
};

function clear() {
	return src('dist/', { allowEmpty: true })
		.pipe(clean()); // Удаляем папку "dist/"
};

function startwatch() {
	watch('app/js/**/*.js', js);
	watch('app/css/**/*.scss', styles);
	watch('app/img/**/*', images)
	watch('app/*.html', html);
};

exports.browsersync = browsersync;
exports.js = js;
exports.styles = styles;
exports.images = images;
exports.html = html;

exports.clear = clear;

exports.default = parallel(html, styles, js, images, browsersync, startwatch);