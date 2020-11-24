/* eslint-disable no-console */
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('clean', async (pkg) => {
        console.log(`clean "${pkg.name}"`);
        await pkg.execSh('ts-cleanup -d dist --remove-dirs --all');
        await pkg.execSh('ts-cleanup -s src --all');
        await pkg.execSh('ts-cleanup -s test');
      }
  ),
  ...packages.createTasks('clean:src', async (pkg) => {
        console.log(`clean:src "${pkg.name}"`);
        await pkg.execSh('ts-cleanup -s src --all');
        await pkg.execSh('ts-cleanup -s test');
      }
  ),
  ...packages.createTasks('clean:dist', async (pkg) => {
        console.log(`clean:dist "${pkg.name}"`);
        await pkg.execSh('ts-cleanup -d dist --remove-dirs --all');
      }
  )

};
