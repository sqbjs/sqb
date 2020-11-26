/* eslint-disable no-console */
const colors = require('colors');
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('lint', async (pkg) => {
        if (pkg.hasScript('lint')) {
          console.log(`lint '${colors.cyan(pkg.name)}'`);
          await pkg.execScript('lint');
        }
      }
  )
};
