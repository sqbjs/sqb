/* eslint-disable no-console */
const colors = require('colors');
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('build', async (pkg) => {
        if (pkg.hasScript('build')) {
          console.log(`build '${colors.cyan(pkg.name)}'`);
          await pkg.execSh('ts-cleanup -d dist --remove-dirs --all');
          await pkg.execScript('build');
        }
      }
  )
};
