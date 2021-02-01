/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../_support/env';
import fs from 'fs';

describe('Repository', function () {

    const testFiles = fs.readdirSync(__dirname + '/repository');
    testFiles.forEach(file => {
        if (file.endsWith('.test.ts'))
            require('./repository/' + file);
    });

});
