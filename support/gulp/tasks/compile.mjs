/* eslint-disable no-console */
import colors from 'colors';
import {packages} from '../package.mjs';

export default {
  ...packages.createTasks('compile', async (pkg) => {
        if (pkg.hasScript('compile')) {
          console.log(`compile '${colors.cyan(pkg.name)}'`);
          await pkg.execScript('compile');
        }
      }
  )
};
