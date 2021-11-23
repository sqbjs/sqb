/* eslint-disable no-console */
import colors from 'colors';
import {packages} from '../package.mjs';
import lint from './lint.mjs';
import clean from './clean.mjs';

const buildTasks = packages.createTasks('build', async (pkg) => {
  if (pkg.hasScript('build')) {
    console.log(`build '${colors.cyan(pkg.name)}'`);
    await pkg.execScript('build');
  }
});

export default {
  ...buildTasks,
  async build() {
    await lint.lint();
    await clean.clean();
    await buildTasks.build();
  }
};
