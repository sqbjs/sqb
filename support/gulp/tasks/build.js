/* eslint-disable no-console */
const colors = require('colors');
const {packages} = require('../package');
const {lint} = require('./lint');
const {clean} = require('./clean');

const buildTasks = packages.createTasks('build', async (pkg) => {
  if (pkg.hasScript('build')) {
    console.log(`build '${colors.cyan(pkg.name)}'`);
    await pkg.execScript('build');
  }
});

module.exports = {
  ...buildTasks,
  async build() {
    await lint();
    await clean();
    await buildTasks.build();
  }
};
