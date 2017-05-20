/* SQB.js
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const Serializer = require('./serializer');
const OracleSerializer = require('./dialects/oracle/ora_serializer');

function createSerializer(config) {
    config = typeof config === 'object' ? config : {dialect: config};

    if (config instanceof Serializer)
        return config;
    let serializer;
    if (config && ['oracle', 'oracledb'].indexOf(config.dialect) >= 0)
        serializer = new OracleSerializer(config);
    else
        serializer = new Serializer(config);
    return serializer;
}

module.exports = createSerializer;