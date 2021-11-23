import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';
import {execSh} from './common.mjs';
import {camelCase} from 'putil-varhelpers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const projectDir = path.resolve(__dirname, '../..');
export const packagesDir = path.join(projectDir, 'packages');
const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

export class Package {

  constructor(name) {
    this.name = name;
    this.dirname = path.join(packagesDir, name);
    this.jsonPath = path.join(this.dirname, 'package.json');
    this.json = JSON.parse(fs.readFileSync(this.jsonPath, 'utf-8'));
  }

  execSh(command, options) {
    return execSh(command, {cwd: this.dirname, ...options});
  }

  hasScript(name) {
    return !!this.json.scripts[name];
  }

  async execScript(name) {
    const command = this.json.scripts[name];
    if (command)
      await this.execSh('npm run ' + name, {cwd: path.dirname(this.jsonPath)});
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
    if (pkgJson.gulp && pkgJson.gulp['package-order']) {
      const order = pkgJson.gulp['package-order'];
      arr.sort((a, b) => {
        const l = order.indexOf(a);
        const r = order.indexOf(b);
        if (l >= 0 && r < 0)
          return 1;
        if (l < 0 && r >= 0)
          return -1;
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

export const packages = new PackageList();
