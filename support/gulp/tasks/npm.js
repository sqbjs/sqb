/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const {execSh, deleteFolderRecursive, rootDir} = require('../common');
const {packages} = require('../package');
const colors = require('colors');

module.exports = {

  async ci() {
    await packages.everyAsync((pkg) => {
      console.log(colors.bold('deleting'), colors.yellow(path.join(pkg.dirname, 'node_modules')));
      deleteFolderRecursive(path.join(pkg.dirname, 'node_modules'));
      if (fs.existsSync(path.join(pkg.dirname, 'package-lock.json')))
        fs.unlinkSync(path.join(pkg.dirname, 'package-lock.json'));
    });
    console.log(colors.bold('deleting'), colors.yellow(path.join(rootDir, 'node_modules')));
    deleteFolderRecursive(path.join(rootDir, 'node_modules'));
    if (fs.existsSync(path.join(rootDir, 'package-lock.json')))
      fs.unlinkSync(path.join(rootDir, 'package-lock.json'));
    return execSh('npm i');
  },

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
