require('coffee-script/register');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var nodemon = require('gulp-nodemon');
var coffeelint = require('gulp-coffeelint');
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var mocha = require('gulp-mocha');
var karma = require('gulp-karma');
var gutil = require('gulp-util');


const BUILD_FOLDER = './public/build/';

const PATHS = {
  css: './app/assets/css/**',
  tests: './test/specs',
  clientTests: './test/specs/client',
  client: './client'
};

gulp.task('develop', function () {
  nodemon({ script: 'server.js', ext: 'html js coffee', ignore: ['ignored.js'] });
});

gulp.task('css', function () {
  var less = require('gulp-less');
  gulp.src(PATHS.css + '/*.less')
      .pipe(less())
      .pipe(concat('style.css'))
      .pipe(gulp.dest('./public/css'));
});


gulp.task('karma', function () {
  return gulp.src([
      PATHS.clientTests + '/**/*.{coffee,js}',
      './test/fixtures/client/**/*.*'
    ])
    .pipe(karma({
      configFile: PATHS.tests + '/karma.conf.js',
      action: 'watch'
    }));
});

gulp.task('mocha', function () {
  require(PATHS.tests + '/spec_helper');

  gulp.src([PATHS.tests + '/**/*.{coffee,js}', '!' + PATHS.clientTests + '/**/*.{coffee,js}'], {read: false})
      .pipe(plumber())
      .pipe(mocha({reporter: 'spec', timeout: 200}));
});


gulp.task('lint', function () {
  gulp.src(PATHS.client + '/src/**/*.coffee')
      .pipe(watch())
      .pipe(coffeelint());
});

gulp.task('browserify_recorder', function () {
  var bundler = watchify([PATHS.client + '/src/bootstrap_recorder.coffee']);
  bundler.transform('coffeeify');
  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
        .pipe(source('recorder.js'))
        .pipe(gulp.dest(BUILD_FOLDER));
  }

  return rebundle();
});


gulp.task('watch', function () {
  gulp.watch([
    'app/controllers/**/*.*',
    'app/helpers/**/*.*',
    'app/models/**/*.*',
    'app/routes/**/*.*',
    'app/views/**/*.*',
    'lib/**/*.*',
    'test/**/*.*',
    'client/**/*.*'
  ], [
    'mocha'
  ]);

  gulp.watch([PATHS.css + '/*.less'], ['css']);
});

gulp.task('set_test_env', function() {
  process.env['NODE_ENV'] = 'test';
});

gulp.task('browserify_replayer', function () {
  var bundler = watchify(PATHS.client + '/src/bootstrap_replayer.coffee');
  bundler.transform('coffeeify');
  bundler.on('update', rebundle);
  bundler.on('error', gutil.log);

  function rebundle() {
    return bundler.bundle()
        .pipe(source('replayer.js'))
        .pipe(gulp.dest(BUILD_FOLDER));
  }

  return rebundle();
});

gulp.task('redis:clear', function() {
  var store = require('./lib/redis_event_store.coffee');
  store.getClient().flushdb();
});

var redisServer = null;
gulp.task('redis:test:reload', function() {
  var spawn = require('child_process').spawn;
  if (redisServer) {
    redisServer.kill('SIGHUP');
  }

  redisServer = spawn('redis-server', ['redis_test.conf']);
});


gulp.task('build', ['lint', 'browserify_replayer', 'browserify_recorder', 'css'], function(){});
gulp.task('test', ['set_test_env', 'redis:test:reload', 'redis:clear', 'mocha', 'watch']);
gulp.task('test_client', ['set_test_env', 'redis:test:reload', 'redis:clear', 'karma']);

gulp.task('default', ['build', 'develop', 'watch'], function () {});
