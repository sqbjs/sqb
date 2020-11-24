/* eslint-disable no-console */
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('cover', async (pkg) => {
        console.log(`cover "${pkg.name}"`);
        await pkg.execSh('nyc --reporter=cobertura --reporter html --reporter text npm run test');
      }
  )
};
