const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const eslint = require('gulp-eslint');

gulp.task('processing', function (done) {

  const stream = nodemon({
    script: 'gulp/processing',
    ext: 'js',
    watch: ['src'],
    tasks: ['lint'],
  });

  stream
    .on('restart', () => console.log('restarted!'))
    .on('crash', () => {
      console.error('Application has crashed!\n')
      // stream.emit('restart', 10)  // restart the server in 10 seconds
    });

});

gulp.task('lint', () => {
  return gulp.src(['src/**/*.js'])
  // eslint() attaches the lint output to the "eslint" property
  // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.formatEach())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});
