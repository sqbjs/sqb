import './_support/env';
import path from 'path';
import glob from 'fast-glob';

const pkgJson = require('../package.json');
const packagesDir = path.join(__dirname, '../packages/');

function importTests(p: string): void {
    const files = glob.sync(path.resolve(path.join(packagesDir, p, '/test/**/*.spec.ts')));
    for (const f of files)
        require(f);
}

for (const p of pkgJson.gulp['compile-order']) {
    describe(p, function () {
        if (p !== 'oracle')
            importTests(p);
    });
}
