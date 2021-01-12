/* eslint-disable no-console */
const colors = require('colors');
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('install', async (pkg) => {
        console.log(`install '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('npm install');
      }
  ),
  ...packages.createTasks('update', async (pkg) => {
        console.log(`update '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('npm update --save');
      }
  ),
  ...packages.createTasks('outdated', async (pkg) => {
        console.log(`outdated '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('npm outdated').catch(() => 0);
      }
  ),
  ...packages.createTasks('audit', async (pkg) => {
        console.log(`audit '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('npm audit').catch(() => 0);
      }
  )
};
