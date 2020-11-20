import {ConnectionAttributes} from 'oracledb';
import {ClientConfiguration} from '@sqb/connect';

export function clientConfigurationToDriver(config: ClientConfiguration): ConnectionAttributes {
    // Sql injection check
    if (config.schema && !config.schema.match(/^\w+$/))
        throw new Error('Invalid schema name');
    const cfg: ConnectionAttributes = {};
    // Authentication options
    if (config.driverOptions?.externalAuth)
        cfg.externalAuth = config.driverOptions?.externalAuth;
    else {
        cfg.user = config.user;
        cfg.password = config.password;
    }
    // Connection options
    if (config.connectString)
        cfg.connectString = config.connectString;
    else if (config.host)
        cfg.connectString = `${config.host}:${config.port || '1521'}` +
            (config.database ? '/' + config.database : '');
    return cfg;
}
