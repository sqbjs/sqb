const clean = require('./tasks/clean');
const lint = require('./tasks/lint');
const build = require('./tasks/build');
const compile = require('./tasks/compile');
const test = require('./tasks/test');
const version = require('./tasks/version');

const tasks = {
  ...clean.tasks,
  ...lint.tasks,
  ...compile.tasks,
  ...build.tasks,
  ...test.tasks,
  ...version.tasks
};

const keys = Object.keys(tasks).sort();
keys.forEach(k => module.exports[k] = tasks[k]);

module.exports.default = module.exports.build;
