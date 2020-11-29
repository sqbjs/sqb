process.env.NODE_ENV = 'test';
process.env.PGSCHEMA = 'test';

try {
    require('./env-dev');
} catch (e) {
    // ignore
}
