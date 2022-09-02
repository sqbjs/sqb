/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import fs from 'fs';

describe('Repository', function () {

    const testFiles = fs.readdirSync(__dirname + '/repository');
    for (const file of testFiles) {
        if (file.endsWith('.sub.ts'))
            require('./repository/' + file);
    }

});
