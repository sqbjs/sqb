process.env.NODE_ENV = 'test';

try {
    require('./env-dev');
} catch (e) {
    // ignore
}
