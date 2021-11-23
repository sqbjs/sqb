import gulp from 'gulp';
import clean from './tasks/clean.mjs';
import lint from './tasks/lint.mjs';
import compile from './tasks/compile.mjs';
import build from './tasks/build.mjs';
import version from './tasks/version.mjs';
import npm from './tasks/npm.mjs';
import publish from './tasks/publish.mjs';

const tasks = {
  ...clean,
  ...lint,
  ...compile,
  ...build,
  ...version,
  ...npm,
  ...publish,
  default: build.build
}

for (const k of Object.keys(tasks)) {
  gulp.task(tasks[k].displayName || k, tasks[k]);
}
