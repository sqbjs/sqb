/* eslint-disable no-console */
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('update', async (pkg) => {
        console.log(`update "${pkg.name}"`);
        await pkg.execSh('npm update --save');
      }
  ),
  ...packages.createTasks('outdated', async (pkg) => {
        console.log(`outdated "${pkg.name}"`);
        await pkg.execSh('npm outdated');
      }
  )
};
