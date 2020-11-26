/* eslint-disable no-console */
const colors = require('colors');
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('update', async (pkg) => {
        console.log(`update '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('npm update --save');
      }
  ),
  ...packages.createTasks('outdated', async (pkg) => {
        console.log(`outdated '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('npm outdated').catch(() => 0);
      }
  )
};
