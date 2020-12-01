const fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');
const npmRunPath = require('npm-run-path');
const minimist = require('minimist');
const colors = require('colors');

const argv = minimist(process.argv.slice(2), {
  string: ['package'],
  boolean: ['dev'],
  alias: {
    p: 'package',
    d: 'dev'
  }
});

function execSh(command, options) {
  const opts = {
    onSpawn: undefined,
    stdio: 'inherit',
    ...options,
    env: npmRunPath.env(),
    windowsHide: true
  };

  return new Promise((resolve, reject) => {
    let rejected;
    try {
      const cp = process.platform === 'win32' ?
          spawn('cmd', ['/C', command], opts) :
          spawn('sh', ['-c', command], opts);
      cp.on('error', (e) => {
        rejected = true;
        if (opts.onError)
          opts.onError(e);
        return reject(new Error(colors.red(`Command failed with code (${e.code})`) +
            `\n  ${colors.gray(command)}\n  ` + e.message));
      });
      cp.on('close', (code) => {
        if (!code)
          return resolve();
        if (!rejected) {
          return reject(new Error(colors.red(`Command failed with code (${code})`) +
              `\n  ${colors.gray(command)}`));
        }
      });
      if (opts.onSpawn)
        opts.onSpawn(cp, command, opts);
    } catch (e) {
      reject(e);
    }

  });
}

function deleteFolderRecursive(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

module.exports = {
  argv,
  execSh,
  deleteFolderRecursive
};
