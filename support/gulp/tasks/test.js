/* eslint-disable no-console */
const colors = require('colors');
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('test', async (pkg) => {
        if (pkg.hasScript('test')) {
          console.log(`test '${colors.cyan(pkg.name)}'`);
          await pkg.execScript('test');
        }
      }
  )
};
