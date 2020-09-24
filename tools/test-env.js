const path = require('path');
const Module = require('module');
const originalRequire = Module.prototype.require;
const packagesDir = path.resolve(__dirname, '../packages');

process.env.NODE_ENV = 'test';
global.SUPPORT_DIR = path.resolve(__dirname, '../support');
global.PACKAGES_DIR = packagesDir;


Module.prototype.require = function(x) {
  if (x.startsWith('@fhirjs/'))
    return originalRequire.call(this, path.join(packagesDir, x.substring(8)));
  return originalRequire.apply(this, arguments);
};
