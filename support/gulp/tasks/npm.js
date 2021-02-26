/* eslint-disable no-console */
const {execSh} = require('../common');

module.exports = {

  async install() {
    return execSh('npm install');
  },

  async update() {
    return execSh('npm update');
  },

  async outdated() {
    return execSh('npm outdated');
  },

  async audit() {
    return execSh('npm audit');
  }

};
