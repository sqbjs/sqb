/* eslint-disable no-console */
const colors = require('colors');
const {packages} = require('../package');

module.exports = {
  ...packages.createTasks('publish', async (pkg) => {
        console.log(`publish '${colors.cyan(pkg.name)}'`);
        await pkg.execSh('npm publish --access public', {
          _onMessage: (msg)=> {
            console.log('MESSAGE', msg);
          }
        });
      }
  )
};
