/* eslint-disable no-console */
import colors from 'colors';
import {packages} from '../package.mjs';

export default {
  ...packages.createTasks('publish', async (pkg) => {
        if (pkg.json.private)
          return;
        console.log(`publish '${colors.cyan(pkg.name)}'`);
        let ignoreError = false;
        let errMsg = '';
        try {
          await pkg.execSh('npm publish --access public', {
            stdio: 'pipe',
            onSpawn: (cp) => {
              cp.stderr.setEncoding('utf8');
              cp.stderr.on('data', (data) => {
                if (data.includes('npm ERR!')) {
                  errMsg += data.replace(/npm ERR!/g, '');
                }
                if (data.includes('403 Forbidden') &&
                    data.includes('previously published')) {
                  console.log(colors.yellow('Package already published!'));
                  ignoreError = true;
                }
              });
            }
          });
        } catch (e) {
          //e.stack = '';
          if (!ignoreError) {
            process.stderr.write(errMsg);
            throw e;
          }
        }
      }
  )
};
