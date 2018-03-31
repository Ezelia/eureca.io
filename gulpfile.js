// Include gulp
const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const Jasmine = require('jasmine');
const JasmineConsoleReporter = require('jasmine-console-reporter');

let buildTarget = 'ES6';


gulp.task('build-client-lib', () => {    
    var tsResult = gulp.src('src/Client.class.ts')
        //.pipe(sourcemaps.init())
        .pipe(ts({
            noImplicitAny: false,
            declarationFiles: false,
            sourceMap: false,
            target: buildTarget,
            removeComments:true,
            out: 'EurecaClient.js'
        }));
    return tsResult.js
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest('lib'));
});



gulp.task('build-server-lib', () => {
    var tsResult = gulp.src('src/Server.class.ts')
        //.pipe(sourcemaps.init())
        .pipe(ts({
            noImplicitAny: false,
            declarationFiles: false,
            sourceMap: false,
            target: buildTarget,
            removeComments: true,
            out: 'EurecaServer.js'
        }));
    return tsResult.js
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest('lib'));
});

gulp.task('test', (done) => {
    // setup Jasmine 
    
    const jasmine = new Jasmine();
    jasmine.loadConfig({
        spec_dir: 'spec',
        spec_files: ['**/*[sS]pec.js'],
        helpers: ['helpers/**/*.js'],
        random: false,
        seed: null,
        stopSpecOnExpectationFailure: false
    });
    jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
    
    // setup console reporter 
    
    const reporter = new JasmineConsoleReporter({
        colors: 1,           // (0|false)|(1|true)|2 
        cleanStack: 1,       // (0|false)|(1|true)|2|3 
        verbosity: 4,        // (0|false)|1|2|(3|true)|4 
        listStyle: 'indent', // "flat"|"indent" 
        activity: false
    });
    

    // initialize and execute 
    jasmine.onComplete(passed => {done()});    
    jasmine.env.clearReporters();
    jasmine.addReporter(reporter);
    jasmine.execute();
});

gulp.task('build-all', gulp.series((done) => {buildTarget = 'ES6'; done()}, 'build-server-lib', 'build-client-lib'));

//gulp.task('es5-build-all', gulp.series((done) => {buildTarget = 'ES5'; done()}, 'build-server-lib', 'build-client-lib'));


