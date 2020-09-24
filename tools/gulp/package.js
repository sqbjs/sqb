const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const {argv, execSh} = require('./common');

const projectDir = path.resolve(__dirname, '../..');
const packagesDir = path.join(projectDir, 'packages');
const pkgjson = require(projectDir + '/package.json');

class Package {

  constructor(name) {
    this.name = name;
    this.dirname = path.join(packagesDir, name);
    const jsonPath = path.join(this.dirname, 'package.json');
    this.json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  execSh(command, options) {
    return execSh(command, {...options, cwd: this.dirname});
  }

  hasScript(name) {
    return !!this.json.scripts[name];
  }

  async execScript(name) {
    const command = this.json.scripts[name];
    if (command) {
      const commands = command.split('&&');
      for (const c of commands) {
        const m = c.match(/^ *npm +run +(.+)/);
        if (m)
          await this.execScript(m[1].trim());
        else
          await this.execSh(c);
      }
    }
  }

  createRunScriptTask(scriptName) {
    if (this.hasScript(scriptName)) {
      const _this = this;
      const task = function() {
        return _this.execScript(scriptName);
      };
      task.displayName = this.name + ':' + scriptName;
      return task;
    }
  }

}

function createRunAllScriptsTask(scriptName, target) {
  const series = [];
  const tasks = {};
  for (const pkg of packages) {
    if (!argv.package || argv.package === pkg.name) {
      const task = pkg.createRunScriptTask(scriptName);
      if (task) {
        series.push(task);
        tasks[pkg.name + ':' + scriptName] = task;
      }
    }
  }
  if (series.length) {
    target[scriptName] = gulp.series(series);
    Object.assign(target, tasks);
  }
}

let packages;
(function preparePackages() {
  const arr = [];
  for (const f of fs.readdirSync(packagesDir, {})) {
    if (fs.statSync(path.join(packagesDir, f)).isDirectory()) {
      arr.push(f);
    }
  }
  if (pkgjson.gulp && pkgjson.gulp['package-order']) {
    const order = pkgjson.gulp['package-order'];
    arr.sort((a, b) => {
      return order.indexOf(a) - order.indexOf(b);
    });
  }
  packages = arr.map(x => new Package(x));
})();

module.exports = {
  Package,
  packages,
  projectDir,
  packagesDir,
  createRunAllScriptsTask
};
