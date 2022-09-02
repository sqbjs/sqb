/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import fs from 'fs';

describe('Model', function () {
    const testFiles = fs.readdirSync(__dirname + '/model');
    for (const file of testFiles) {
        if (file.endsWith('.sub.ts'))
            require('./model/' + file);
    }
});
