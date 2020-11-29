import {Logger, Type} from '@nestjs/common';
import {Observable} from 'rxjs';
import {delay, retryWhen, scan} from 'rxjs/operators';
import {Client} from '@sqb/connect';
import {v4 as uuid} from 'uuid';
import {DEFAULT_CONNECTION_NAME} from '../sqb.constants';
// noinspection ES6PreferShortImport
import {SqbModuleOptions} from '../interfaces/sqb-options.interface';

const logger = new Logger('SqbModule');

/**
 * This function returns a Connection injection token for the given Connection, ConnectionOptions or connection name.
 * @param {SqbModuleOptions | string} [client='default'] This optional parameter is either
 * a Connection, or a ConnectionOptions or a string.
 * @returns {string | Function} The Connection injection token.
 */
export function getConnectionToken(
    client: SqbModuleOptions | string = DEFAULT_CONNECTION_NAME,
): string | Type<Client> {
    return DEFAULT_CONNECTION_NAME === client ? Client
        : ('string' === typeof client ? `${client}Connection`
            : (DEFAULT_CONNECTION_NAME === client.name || !client.name ? Client
                : `${client.name}Connection`));
}

export function handleRetry(
    retryAttempts = 9,
    retryDelay = 3000,
    connectionName = DEFAULT_CONNECTION_NAME,
    verboseRetryLog = false,
    toRetry?: (err: any) => boolean,
): <T>(source: Observable<T>) => Observable<T> {
    return <T>(source: Observable<T>) =>
        source.pipe(
            retryWhen((e) =>
                e.pipe(
                    scan((errorCount, error: Error) => {
                        if (toRetry && !toRetry(error)) {
                            throw error;
                        }
                        const connectionInfo =
                            connectionName === DEFAULT_CONNECTION_NAME
                                ? ''
                                : ` (${connectionName})`;
                        const verboseMessage = verboseRetryLog
                            ? ` Message: ${error.message}.`
                            : '';

                        logger.error(
                            `Unable to connect to the database${connectionInfo}.${verboseMessage} Retrying (${errorCount +
                            1})...`,
                            error.stack,
                        );
                        if (errorCount + 1 >= retryAttempts) {
                            throw error;
                        }
                        return errorCount + 1;
                    }, 0),
                    delay(retryDelay),
                ),
            ),
        );
}

export const generateString = () => uuid();
