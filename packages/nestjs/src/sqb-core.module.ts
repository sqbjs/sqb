import {
    DynamicModule,
    Global,
    Inject,
    Module,
    OnApplicationShutdown,
    Provider,
    Type,
} from '@nestjs/common';
import {ModuleRef} from '@nestjs/core';
import {defer} from 'rxjs';
import * as rxjs from 'rxjs';
import {SqbClient} from '@sqb/connect';
import {
    generateString,
    getConnectionToken,
    handleRetry,
} from './common/sqb.utils';
import {
    SqbModuleAsyncOptions,
    SqbModuleOptions,
    SqbOptionsFactory,
} from './interfaces/sqb-options.interface';
import {
    DEFAULT_CONNECTION_NAME,
    SQB_MODULE_ID,
    SQB_MODULE_OPTIONS,
} from './sqb.constants';

@Global()
@Module({})
export class SqbCoreModule implements OnApplicationShutdown {
    constructor(
        @Inject(SQB_MODULE_OPTIONS)
        private readonly options: SqbModuleOptions,
        private readonly moduleRef: ModuleRef,
    ) {
    }

    static forRoot(options: SqbModuleOptions = {}): DynamicModule {
        const optionsProvider = {
            provide: SQB_MODULE_OPTIONS,
            useValue: options,
        };
        const connectionProvider = {
            provide: getConnectionToken(options as SqbModuleOptions) as string,
            useFactory: () => this.createConnectionFactory(options),
        };

        return {
            module: SqbCoreModule,
            providers: [connectionProvider, optionsProvider],
            exports: [connectionProvider],
        };
    }

    static forRootAsync(options: SqbModuleAsyncOptions): DynamicModule {
        const connectionProvider = {
            provide: getConnectionToken(options as SqbModuleOptions) as string,
            inject: [SQB_MODULE_OPTIONS],
            useFactory: async (sqbOptions: SqbModuleOptions) => {
                const name = options.name || sqbOptions.name;
                return await this.createConnectionFactory({
                    ...sqbOptions,
                    name
                });
            }
        };

        const asyncProviders = this.createAsyncProviders(options);
        return {
            module: SqbCoreModule,
            imports: options.imports,
            providers: [
                ...asyncProviders,
                connectionProvider,
                {
                    provide: SQB_MODULE_ID,
                    useValue: generateString(),
                },
            ],
            exports: [connectionProvider],
        };
    }

    async onApplicationShutdown() {
        const client = this.moduleRef.get<SqbClient>(
            getConnectionToken(this.options as SqbModuleOptions) as Type<SqbClient>,
        );
        if (client)
            await client.close(this.options.shutdownWaitMs);
    }

    private static createAsyncProviders(options: SqbModuleAsyncOptions): Provider[] {
        if (options.useExisting || options.useFactory)
            return [this.createAsyncOptionsProvider(options)];

        if (options.useClass)
            return [
                this.createAsyncOptionsProvider(options),
                {
                    provide: options.useClass,
                    useClass: options.useClass
                }
            ];

        throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting');
    }

    private static createAsyncOptionsProvider(options: SqbModuleAsyncOptions): Provider {
        if (options.useFactory) {
            return {
                provide: SQB_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        const useClass = options.useClass || options.useExisting;
        if (useClass) {
            return {
                provide: SQB_MODULE_OPTIONS,
                useFactory: async (optionsFactory: SqbOptionsFactory) =>
                    await optionsFactory.createSqbOptions(options.name),
                inject: [useClass],
            };
        }
        throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting');
    }

    private static async createConnectionFactory(
        options: SqbModuleOptions,
    ): Promise<SqbClient> {
        const connectionToken = options.name || DEFAULT_CONNECTION_NAME;
        // NestJS 8
        // @ts-ignore
        if (rxjs.lastValueFrom) {
            // @ts-ignore
            return await rxjs.lastValueFrom(
                defer(async () => {
                    const client = new SqbClient(options);
                    await client.test();
                    return client;
                }).pipe(
                    handleRetry(
                        options.retryAttempts,
                        options.retryDelay,
                        connectionToken,
                        options.verboseRetryLog,
                        options.toRetry,
                    ),
                ));
        } else {
            // NestJS 7
            // @ts-ignore
            return await defer(async () => {
                const client = new SqbClient(options);
                await client.test();
                return client;
            })
                .pipe(
                    handleRetry(
                        options.retryAttempts,
                        options.retryDelay,
                        connectionToken,
                        options.verboseRetryLog,
                        options.toRetry,
                    ),
                )
                .toPromise();
        }
    }
}
