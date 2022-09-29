// Определяем константы gulp
const { src, dest, parallel, series, watch } = require('gulp');

// Подключаем Browsersync с указанием create для нового подключения
const browserSync = require('browser-sync').create();

// Подключаем gulp-concat
const concat = require('gulp-concat');

// Подключаем gulp-sass
const sass = require('gulp-sass')(require('sass'));

// Подключаем Autoprefixer
const autoprefixer = require('gulp-autoprefixer');

// Подключаем gulp-clean-css
const cleancss = require('gulp-clean-css');

// Подключаем compress-images для работы с изображениями
const imagecomp = require('compress-images');

// Подключаем модуль gulp-clean вместо (del)
const clean = require('gulp-clean');

// Подключаем webpack
const webpack = require('webpack-stream');

const isBuild = process.argv.includes('--build');

// Определим логику работы Browsersync 
function browsersync() {
	browserSync.init({ // Инициализация Browsersync
		server: { baseDir: 'dist/' }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true // Режим работы: true или false
	})
};

function js() {
	return src('app/js/app.js')
		.pipe(webpack({
			mode: isBuild ? 'production' : 'development',
			output: {
				filename: 'app.js'
			},
			watch: false,
			devtool: isBuild ? false : 'source-map',
			module: {
				rules: [
					{
						test: /\.m?js$/,
						exclude: /(node_modules|bower_components)/,
						use: {
							loader: 'babel-loader',
							options: {
								presets: [['@babel/preset-env', {
									debug: isBuild ? false : true,
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

function html() {
	return src('app/**/*.html')
		.pipe(dest('dist/'))
		.pipe(browserSync.stream());
}

async function images() {
	imagecomp(
		'app/img/**/*', // Берем все изображения из папки источника
		'dist/img/', // Выгружаем оптимизированные изображения в папку назначенияё
		{ compress_force: false, statistic: true, autoupdate: true }, false, // Настраиваем основные параметры
		{ jpg: { engine: 'mozjpeg', command: ['-quality', '75'] } }, // Сжимаем и оптимизируем изображения
		{ png: { engine: 'pngquant', command: ['--quality=75-100', '-o'] } },
		{ svg: { engine: 'svgo', command: '--multipass' } },
		{ gif: { engine: 'gifsicle', command: ['--colors', '64', '--use-col=web'] } },
		function (err, completed) { // обновляем страницу по завершению
			if (completed === true) {
				browserSync.reload();
			}
		}
	)
};

function clear() {
	return src('dist/', { allowEmpty: true })
		.pipe(clean()); // Удаляем папку "dist/"
};

function startwatch() {
	// Выбираем все файлы js в проекте, а затем исключим с суффиксом .min.js
	watch('app/js/**/*.js', js);

	// Мониторим файлы препроцессора на изменения
	watch('app/css/**/*.scss', styles);

	// Мониторим файлы HTML на изменения
	watch('app/**/*.html', html);

	// Мониторим папку источник изображений и выполняем images(), если есть изменения
	watch('app/img/**/*', images);
};

// Экспортируем функцию browsersync()
exports.browsersync = browsersync;

// Экспортируем функцию js() в таск scripts
exports.js = js;

// Экспортируем функцию styles() в таск styles
exports.styles = styles;

// Экспортируем функцию images() в таск images
exports.images = images;

// Экспортируем функцию clear() как таск cleanimg
exports.clear = clear;

// Создаем таск 'build', который последовательно выполняет нужные операции
exports.build = series(clear, html, styles, js, images);

// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(html, images, styles, js, browsersync, startwatch);