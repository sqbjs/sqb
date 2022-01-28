import './_support/env';
import path from 'path';
import glob from 'fast-glob';
import {Repository} from 'rman';

const rootDir = path.resolve(__dirname, '../');

async function importTests(p: string): Promise<void> {
    const s = path.resolve(path.join(rootDir, 'packages', p, 'test/**/*.spec.ts'));
    const files = glob.sync(s);
    for (const f of files)
        await import(f);
}

const repository = Repository.create(rootDir);
for (const p of repository.packages) {
    const basename = path.basename(p.dirname);
    describe(basename, async function () {
        if (basename !== 'oracle')
            await importTests(basename);
    });
}
