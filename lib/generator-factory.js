/**
 * Internal module dependencies.
 */

const Generator = require('./generator');
const OracleGenerator = require('./dialects/oracle/ora_generator');

function createGenerator(config) {
    config = typeof config === 'object' ? config : {dialect: config};

    if (config instanceof Generator)
        return config;
    let generator;
    if (config && ['oracle', 'oracledb'].indexOf(config.dialect) >= 0)
        generator = new OracleGenerator(config);
    else
        generator = new Generator(config);
    return generator;
}

module.exports = createGenerator;