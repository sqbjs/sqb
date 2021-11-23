import path from 'path';
import colors from 'colors';
import {packages} from '../package.mjs';
import {deleteFolderRecursive} from '../common.mjs';

export default {
  ...packages.createTasks('clean', async (pkg) => {
        console.log(`clean '${colors.cyan(pkg.name)}'`);
        deleteFolderRecursive(path.join(pkg.dirname, 'dist'));
        deleteFolderRecursive(path.join(pkg.dirname, 'node_modules'));
        await pkg.execSh('ts-cleanup -s src --all');
        await pkg.execSh('ts-cleanup -s test');
      }
  ),
  ...packages.createTasks('clean:src', async (pkg) => {
        console.log(`clean:src '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('ts-cleanup -s src --all');
        await pkg.execSh('ts-cleanup -s test');
      }
  ),
  ...packages.createTasks('clean:dist', async (pkg) => {
        console.log(`clean:dist '${colors.cyan(pkg.name)}'`);
        deleteFolderRecursive(path.join(pkg.dirname, 'dist'));
      }
  ),
  ...packages.createTasks('clean:coverage', async (pkg) => {
        console.log(`clean:coverage '${colors.cyan(pkg.name)}'`);
        deleteFolderRecursive(path.join(pkg.dirname, 'coverage'));
      }
  )
};

