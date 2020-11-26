const clean = require('./tasks/clean');
const lint = require('./tasks/lint');
const compile = require('./tasks/compile');
const build = require('./tasks/build');
const cover = require('./tasks/cover');
const test = require('./tasks/test');
const update = require('./tasks/update');
const version = require('./tasks/version');
const link = require('./tasks/link');

const tasks = {
  ...clean,
  ...lint,
  ...compile,
  ...build,
  ...cover,
  ...test,
  ...update,
  ...version,
  ...link
};

const keys = Object.keys(tasks).sort();
keys.forEach(k => module.exports[k] = tasks[k]);

module.exports.default = module.exports.build;
