/* eslint-disable no-console */
import colors from 'colors';
import {packages} from '../package.mjs';

export default {
  ...packages.createTasks('lint', async (pkg) => {
        if (pkg.hasScript('lint')) {
          console.log(`lint '${colors.cyan(pkg.name)}'`);
          await pkg.execScript('lint');
        }
      }
  )
};
