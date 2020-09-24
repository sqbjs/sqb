const gulp = require('gulp');
const {argv} = require('../common');
const {packages} = require('../package');

function build() {
  const tasks = [];
  for (const pkg of packages) {
    if (!argv.package || argv.package === pkg.name) {
      let task = pkg.createRunScriptTask('clean');
      if (task)
        tasks.push(task);
      task = pkg.createRunScriptTask('lint');
      if (task)
        tasks.push(task);
      task = pkg.createRunScriptTask('build');
      if (task)
        tasks.push(task);
    }
  }
  return gulp.series(tasks);
}

module.exports = {
  tasks: {
    build: build()
  }
};
