/* eslint-disable */
const autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync'),
    cleanCSS = require('gulp-clean-css'),
    copyDepsYaml = './copydeps.yml',
    cssImporter = require('node-sass-css-importer')({
        import_paths: ['./scss']
    }),
    del = require('del'),
    eslint = require('gulp-eslint'),
    gulp = require('gulp'),
    log = require('fancy-log'),
    newer = require('gulp-newer'),
    path = require('path'),
    reload = browserSync.reload,
    rename = require('gulp-rename'),
    rollup = require('rollup'),
    rollupBabel = require('rollup-plugin-babel'),
    rollupCommonjs = require('rollup-plugin-commonjs'),
    rollupResolve = require('rollup-plugin-node-resolve'),
    rollupUglify = require('rollup-plugin-uglify').uglify,
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    themeYaml = './theme.yml',
    year = new Date().getFullYear(),
    yaml = require('yamljs');

let copyDeps = yaml.load(copyDepsYaml);
let theme = yaml.load(themeYaml);

const babelConfig = {
    presets: [
        [
            '@babel/env',
            {
                loose: true,
                modules: false,
                exclude: ['transform-typeof-symbol']
            }
        ]
    ],
    plugins: [
        '@babel/plugin-proposal-object-rest-spread'
    ],
    env: {
        test: {
            plugins: ['istanbul']
        }
    },
    exclude: 'node_modules/**', // Only transpile our source code
    externalHelpersWhitelist: [ // Include only required helpers
        'defineProperties',
        'createClass',
        'inheritsLoose',
        'defineProperty',
        'objectSpread'
    ],
};

getPaths = () => {
    return {
        here: './',
        pages: {
            folder: 'pages',
            all: ['pages/**/*'],
            html: 'pages/*.html',
            liquid: 'pages/**/*.liquid',
            liquidRoot: 'pages/',
            includes: 'pages/include/',
            layouts: 'pages/layouts'
        },
        js: {
            all: "js/**/*",
            bootstrap: {
                all: [
                    "./resources/js/bootstrap/util.js",
                    "./resources/js/bootstrap/alert.js",
                    "./resources/js/bootstrap/button.js",
                    "./resources/js/bootstrap/carousel.js",
                    "./resources/js/bootstrap/collapse.js",
                    "./resources/js/bootstrap/dropdown.js",
                    "./resources/js/bootstrap/modal.js",
                    "./resources/js/bootstrap/tooltip.js",
                    "./resources/js/bootstrap/popover.js",
                    "./resources/js/bootstrap/scrollspy.js",
                    "./resources/js/bootstrap/toast.js",
                    "./resources/js/bootstrap/tab.js"
                ],
                index: "./resources/js/bootstrap/index.js"
            },
            mrare: {
                all: "./resources/js/mrare/**/*.js",
                index: "./resources/js/mrare/index.js",
            }
        },
        scss: {
            folder: './resources/scss',
            all: './resources/scss/**/*',
            root: './resources/scss/*.scss',
            themeScss: ['./resources/scss/theme.scss', '!./resources/scss/user.scss', '!./resources/scss/user-variables.scss'],
        },
        assets: {
            all: 'resources/assets/**/*',
            folder: 'resources/assets',
            allFolders: ['resources/assets/css', 'resources/assets/img', 'resources/assets/fonts', 'resources/assets/video'],
        },
        css: {
            folder: 'assets/css',
        },
        fonts: {
            folder: 'assets/fonts',
            all: 'assets/fonts/*.*',
        },
        images: {
            folder: 'assets/img',
            all: 'assets/img/*.*',
        },
        videos: {
            folder: 'assets/video',
            all: 'assets/video/*.*',
        },
        dist: {
            packageFolder: '',
            folder: 'public/leap',
            pages: 'public/leap/pages',
            all: 'public/leap/**/*',
            assets: 'public/leap/assets',
            img: 'public/leap/assets/img',
            css: 'public/leap/assets/css',
            scssSources: 'public/leap/scss',
            js: 'public/leap/assets/js',
            jsSources: 'public/leap/js',
            fonts: 'public/leap/assets/fonts',
            video: 'public/leap/assets/video',
            documentation: 'public/leap/documentation',
            exclude: ['!**/desktop.ini', '!**/.DS_store'],
        },
        copyDependencies: copyDeps,
    }
};

let paths = getPaths();

// DEFINE TASKS

gulp.task('clean:dist', function (done) {
    del.sync(paths.dist.all, {
        force: true
    });
    done();
});

// Copy html files to dist
gulp.task('html', function () {
    return gulp.src(paths.pages.all, {
            base: paths.pages.folder
        })
        .pipe(newer(paths.dist.folder))
        .pipe(gulp.dest(paths.dist.folder))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('sass', function () {
    return gulp.src(paths.scss.themeScss)
        .pipe(sourcemaps.init())
        .pipe(sass({
            importer: [cssImporter]
        }).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist.css))
        .pipe(browserSync.stream({
            match: "**/theme*.css"
        }));
});

gulp.task('sass-min', function () {
    return gulp.src(paths.scss.themeScss)
        .pipe(sourcemaps.init())
        .pipe(sass({
            importer: [cssImporter]
        }).on('error', sass.logError))
        .pipe(cleanCSS({
            compatibility: 'ie9'
        }))
        .pipe(autoprefixer())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist.css))
        .pipe(browserSync.stream({
            match: "**/theme*.css"
        }));
});

gulp.task('bootstrapjs', async (done) => {
    let fileDest = 'bootstrap.js';
    const banner = `/*!
  * Bootstrap v${theme.bootstrap_version}
  * Copyright 2011-${year} The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
  */`;
    const external = ['jquery', 'popper.js'];
    const plugins = [
        rollupBabel(babelConfig),
        rollupUglify({
            output: {
                comments: "/^!/"
            }
        }),
    ];
    const globals = {
        jquery: 'jQuery', // Ensure we use jQuery which is always available even in noConflict mode
        'popper.js': 'Popper'
    };

    const bundle = await rollup.rollup({
        input: paths.js.bootstrap.index,
        external,
        plugins
    });

    await bundle.write({
        file: path.resolve(__dirname, `./${paths.dist.js}${path.sep}${fileDest}`),
        banner,
        globals,
        format: 'umd',
        name: 'bootstrap',
        sourcemap: true,
    });
    // Reload Browsersync clients
    reload();
    done();
});

gulp.task('mrarejs', async (done) => {
    gulp.src(paths.js.mrare.all)
        .pipe(eslint())
        .pipe(eslint.format());

    let fileDest = 'theme.js';
    const banner = `/*!
  * ${theme.name}
  * Copyright 2018-${year} Medium Rare (${theme.purchase_link})
  */`;
    const external = [...theme.scripts.external];
    const plugins = [
        rollupCommonjs(),
        rollupResolve({
            browser: true,
        }),
        rollupBabel(babelConfig),
        theme.minify_scripts === true ? rollupUglify({
            output: {
                comments: "/^!/"
            }
        }) : null,
    ];
    const globals = theme.scripts.globals;

    const bundle = await rollup.rollup({
        input: paths.js.mrare.index,
        external,
        plugins,
        onwarn: function (warning) {
            // Skip certain warnings
            if (warning.code === 'THIS_IS_UNDEFINED') {
                return;
            }
            // console.warn everything else
            console.warn(warning.message);
        }
    });

    await bundle.write({
        file: path.resolve(__dirname, `./${paths.dist.js}${path.sep}${fileDest}`),
        banner,
        globals,
        format: 'umd',
        name: 'theme',
        sourcemap: true,
        sourcemapFile: path.resolve(__dirname, `./${paths.dist.js}${path.sep}${fileDest}.map`),
    });
    // Reload Browsersync clients
    reload();
    done();
});

// Assets
gulp.task('copy-assets', function () {
    return gulp.src(paths.assets.all, {
            base: paths.assets.folder
        })
        .pipe(newer(paths.dist.assets))
        .pipe(gulp.dest(paths.dist.assets))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('deps', async (done) => {
    await paths.copyDependencies.forEach(function (filesObj) {
        let files;
        if (typeof filesObj.files == 'object') {
            files = filesObj.files.map((file) => {
                return `${filesObj.from}/${file}`;
            });
        } else {
            files = `${filesObj.from}/${filesObj.files}`;
        }

        gulp.src(files)
            .pipe(gulp.dest(filesObj.to, {
                overwrite: true
            }));
    });
    done();
});

// watch files for changes and reload
gulp.task('serve', function (done) {
    browserSync({
        server: {
            baseDir: './dist',
            index: "index.html"
        }
    });
    done();
});

gulp.task('watch', function (done) {

    // PAGES
    // Watch only .html pages as they can be recompiled individually
    gulp.watch([paths.pages.html], {
        cwd: './'
    }, gulp.series('html', function reloadPage(done) {
        reload();
        done();
    }));

    // SCSS
    // Any .scss file change will trigger a sass rebuild
    gulp.watch([paths.scss.all], {
        cwd: './'
    }, gulp.series('sass'));

    // JS
    // Rebuild bootstrap js if files change
    gulp.watch([...paths.js.bootstrap.all], {
        cwd: './'
    }, gulp.series('bootstrapjs'));

    // Rebuild mrare js if files change
    gulp.watch([paths.js.mrare.all], {
        cwd: './'
    }, gulp.series('mrarejs'));

    // Rebuild mrare js if files change
    const assetsWatcher = gulp.watch([paths.assets.all, ...paths.assets.allFolders], {
        cwd: './'
    }, gulp.series('copy-assets'));

    assetsWatcher.on('change', function (path) {
        console.log('File ' + path + ' was changed');
    });

    assetsWatcher.on('unlink', function (path) {
        const changedDistFile = path.resolve(paths.dist.assets, path.relative(path.resolve(paths.assets.folder), event.path));
        console.log('File ' + path + ' was removed');
        del.sync(path);
    });

    done();
    // End watch task

});

gulp.task('default', gulp.series('clean:dist', 'copy-assets', gulp.series('html', 'sass', 'sass-min', 'bootstrapjs', 'mrarejs'), gulp.series('serve', 'watch')));

gulp.task('build', gulp.series('clean:dist', 'copy-assets', gulp.series('html', 'sass', 'sass-min', 'bootstrapjs', 'mrarejs')));
