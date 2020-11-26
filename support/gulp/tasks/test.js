/* eslint-disable no-console */
const path = require('path');
const colors = require('colors');
const {packages} = require('../package');
const {deleteFolderRecursive} = require('../common');

module.exports = {
  ...packages.createTasks('test', async (pkg) => {
        if (pkg.hasScript('test')) {
          console.log(`test '${colors.cyan(pkg.name)}'`);
          await pkg.execScript('test');
        }
      }
  ),
  ...packages.createTasks('cover', async (pkg) => {
        console.log(`cover '${colors.cyan(pkg.name)}'`);
        deleteFolderRecursive(path.join(pkg.dirname, 'coverage'));
        await pkg.execSh('nyc --reporter=cobertura --reporter html --reporter text npm run test');
      }
  )
};
