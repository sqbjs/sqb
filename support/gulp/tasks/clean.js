/* eslint-disable no-console */
const path = require('path');
const colors = require('colors');
const {packages} = require('../package');
const {deleteFolderRecursive} = require('../common');

module.exports = {
  ...packages.createTasks('clean', async (pkg) => {
        console.log(`clean '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('ts-cleanup -d dist --remove-dirs --all');
        await pkg.execSh('ts-cleanup -s src --all');
        await pkg.execSh('ts-cleanup -s test');
      }
  ),
  ...packages.createTasks('clean:src', async (pkg) => {
        console.log(`clean:src '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('ts-cleanup -s src --all');
        await pkg.execSh('ts-cleanup -s test');
      }
  ),
  ...packages.createTasks('clean:dist', async (pkg) => {
        console.log(`clean:dist '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('ts-cleanup -d dist --remove-dirs --all');
      }
  ),
  ...packages.createTasks('clean:coverage', async (pkg) => {
        console.log(`clean:coverage '${colors.cyan(pkg.name)}'`);
        deleteFolderRecursive(path.join(pkg.dirname, 'coverage'));
      }
  )

};
