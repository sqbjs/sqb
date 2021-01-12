/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../_support/env';
import fs from 'fs';

describe('Decorators', function () {

    const testFiles = fs.readdirSync(__dirname + '/decorators');
    testFiles.forEach(file => {
        if (file.endsWith('.test.ts'))
            require('./decorators/' + file);
    });

});
