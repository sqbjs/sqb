/* eslint-disable no-console */
import path from 'path';
import fs from 'fs';
import colors from 'colors';
import {packages} from '../package.mjs';
import semver from 'semver';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function versionPackage(pkg, version) {
  console.log(`version '${colors.cyan(pkg.name)}'`);
  pkg.json.version = version;
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach((n) => {
    if (!pkg.json[n])
      return;
    for (const k of Object.keys(pkg.json[n])) {
      if (k.startsWith('@sqb/'))
        pkg.json[n][k] = '^' + version;
    }
  });
  const data = JSON.stringify(pkg.json, null, 2);
  fs.writeFileSync(path.join(pkg.dirname, 'package.json'), data, 'utf-8');
}

function version(option) {
  return async function() {
    const p = path.resolve(__dirname, '../../../package.json');
    const json = JSON.parse(fs.readFileSync(p, 'utf-8'));
    if (option) {
      json.version = semver.inc(json.version, option);
      fs.writeFileSync(p, JSON.stringify(json, null, 2), 'utf-8');
    }
    console.log(`Updating version to '${colors.magenta(json.version)}'`);
    for (const pkg of packages.items) {
      versionPackage(pkg, json.version);
    }
  };
}

export default {
  'version': version(),
  'version:patch': version('patch'),
  'version:minor': version('minor'),
  'version:major': version('major')
};
