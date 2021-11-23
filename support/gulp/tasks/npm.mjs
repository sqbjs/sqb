/* eslint-disable no-console */
import path from 'path';
import fs from 'fs';
import colors from 'colors';
import {packages} from '../package.mjs';
import {execSh, deleteFolderRecursive, rootDir} from '../common.mjs';

export default {

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
  }

};
