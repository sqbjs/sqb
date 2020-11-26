/* eslint-disable no-console */
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('link', async (pkg) => {
        console.log(`link "${pkg.name}"`);
        await pkg.execSh('npm link');
      }
  ),
  ...packages.createTasks('unlink', async (pkg) => {
        console.log(`unlink "${pkg.name}"`);
        await pkg.execSh('npm unlink');
      }
  )
};
