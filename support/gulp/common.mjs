import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'child_process';
import {npmRunPathEnv} from 'npm-run-path';
import minimist from 'minimist';
import colors from 'colors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const rootDir = path.resolve(__dirname, '../..');

export const argv = minimist(process.argv.slice(2), {
  string: ['package'],
  boolean: ['dev'],
  alias: {
    p: 'package',
    d: 'dev'
  }
});

export function execSh(command, options) {
  const opts = {
    onSpawn: undefined,
    stdio: 'inherit',
    ...options,
    env: npmRunPathEnv(),
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

export function deleteFolderRecursive(dir) {
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

