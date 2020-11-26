/* eslint-disable no-console */
const colors = require('colors');
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('link', async (pkg) => {
        console.log(`link '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('npm link');
      }
  ),
  ...packages.createTasks('unlink', async (pkg) => {
        console.log(`unlink '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('npm unlink');
      }
  )
};
