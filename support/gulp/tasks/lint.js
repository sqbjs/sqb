/* eslint-disable no-console */
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('lint', async (pkg) => {
        if (pkg.hasScript('lint')) {
          console.log(`lint "${pkg.name}"`);
          await pkg.execScript('lint');
        }
      }
  )
};
