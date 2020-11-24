/* eslint-disable no-console */
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('test', async (pkg) => {
        if (pkg.hasScript('test')) {
          console.log(`test "${pkg.name}"`);
          await pkg.execScript('test');
        }
      }
  )
};
