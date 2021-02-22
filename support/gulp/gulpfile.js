const clean = require('./tasks/clean');
const lint = require('./tasks/lint');
const compile = require('./tasks/compile');
const build = require('./tasks/build');
const test = require('./tasks/test');
const version = require('./tasks/version');
const link = require('./tasks/link');
const publish = require('./tasks/publish');

const tasks = {
  ...clean,
  ...lint,
  ...compile,
  ...build,
  ...test,
  ...version,
  ...link,
  ...publish
};

const keys = Object.keys(tasks).sort();
keys.forEach(k => module.exports[k] = tasks[k]);

module.exports.default = module.exports.build;
