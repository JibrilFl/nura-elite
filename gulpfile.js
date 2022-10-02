const { src, dest, parallel, series, watch } = require('gulp');

const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const clean = require('gulp-clean');
const webpack = require('webpack-stream');

function browsersync() {
	browserSync.init({ // Инициализация Browsersync
		server: { baseDir: 'app/' }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true, // Режим работы: true или false
		port: 8000
	})
};

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
		.pipe(dest('app/js/'))
		.on('end', browserSync.reload);
};

function styles() {
	return src('app/css/style.scss') // Выбираем источник
		.pipe(sass()) // Подключаем sass
		.pipe(concat('style.min.css')) // Конкатенируем в файл style.min.css
		.pipe(autoprefixer({ ovverideBrowserslist: ['last 10 versions'], grid: true })) // Создаем префиксы с помощью Autoprefixer
		.pipe(cleancss({ level: { 1: { specialComments: 0 } }, /* format: 'beautify' */ })) // Минифицируем стили
		.pipe(dest('app/css/')) // Выгрузим результат в папку "app/css/"
		.pipe(browserSync.stream()); // Триггерим Browsersync для обновления страницы
};

function clear() {
	return src('dist/', { allowEmpty: true })
		.pipe(clean()); // Удаляем папку "dist/"
};

function startwatch() {
	watch(['app/js/**/*.js', '!app/js/*.min.js'], js);
	watch('app/css/**/*.scss', styles);
	watch('app/**/*.html').on('change', browserSync.reload);
};

function buildcopy() {
	return src([ // Выбираем нужные файлы
		'app/css/**/*.min.css',
		'app/js/**/*.min.js',
		'app/img/**/*',
		'app/**/*.html',
	], { base: 'app' }) // Параметр "base" сохраняет структуру проекта при копировании
		.pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
}

exports.browsersync = browsersync;
exports.js = js;
exports.styles = styles;
exports.clear = clear;
exports.buildcopy = buildcopy;

exports.build = series(clear, styles, js, buildcopy);

exports.default = parallel(styles, js, browsersync, startwatch);