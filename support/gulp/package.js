const path = require('path');
const fs = require('fs');
const {execSh} = require('./common');
const {camelCase} = require('putil-varhelpers');

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

class PackageList {
  constructor() {
    const arr = [];
    for (const f of fs.readdirSync(packagesDir, {})) {
      if (fs.statSync(path.join(packagesDir, f)).isDirectory()) {
        arr.push(f);
      }
    }
    if (pkgjson.gulp && pkgjson.gulp['package-order']) {
      const order = pkgjson.gulp['package-order'];
      arr.sort((a, b) => {
        if (!order.includes(a))
          return 1;
        return order.indexOf(a) - order.indexOf(b);
      });
    }
    this.items = arr.map(x => new Package(x));
  }

  async everyAsync(fn) {
    for (const pkg of this.items) {
      await fn(pkg);
    }
  }

  createTasks(displayName, fn) {
    const tasks = {};
    let task = async () => {
      try {
        for (const pkg of this.items) {
          await fn(pkg);
        }
      } catch (e) {
        // eslint-disable-next-line
        console.error(e.message);
      }
    };
    task.displayName = displayName;
    tasks[camelCase(task.displayName)] = task;
    for (const pkg of this.items) {
      task = async () => {
        try {
          await fn(pkg);
        } catch (e) {
          // eslint-disable-next-line
          console.error(e.message);
        }
      };
      task.displayName = displayName + '@' + pkg.name;
      tasks[camelCase(task.displayName)] = task;
    }
    return tasks;
  }

}

const packages = new PackageList();

module.exports = {
  Package,
  packages,
  projectDir,
  packagesDir
};
