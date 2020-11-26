/* eslint-disable no-console */
const colors = require('colors');
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('compile', async (pkg) => {
        if (pkg.hasScript('compile')) {
          console.log(`compile '${colors.cyan(pkg.name)}'`);
          await pkg.execScript('compile');
        }
      }
  )
};
