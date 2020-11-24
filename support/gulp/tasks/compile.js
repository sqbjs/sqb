/* eslint-disable no-console */
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('compile', async (pkg) => {
        if (pkg.hasScript('compile')) {
          console.log(`compile "${pkg.name}"`);
          await pkg.execScript('compile');
        }
      }
  )
};
