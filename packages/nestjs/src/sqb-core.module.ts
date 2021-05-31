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
import {defer, lastValueFrom} from 'rxjs';
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
        const sqbModuleOptions = {
            provide: SQB_MODULE_OPTIONS,
            useValue: options,
        };
        const connectionProvider = {
            provide: getConnectionToken(options as SqbModuleOptions) as string,
            useFactory: async () => await this.createConnectionFactory(options),
        };

        return {
            module: SqbCoreModule,
            providers: [connectionProvider, sqbModuleOptions],
            exports: [connectionProvider],
        };
    }

    static forRootAsync(options: SqbModuleAsyncOptions): DynamicModule {
        const connectionProvider = {
            provide: getConnectionToken(options as SqbModuleOptions) as string,
            useFactory: async (sqbOptions: SqbModuleOptions) => {
                const name = options.name || sqbOptions.name;
                return await this.createConnectionFactory({
                    ...sqbOptions,
                    name
                });
            },
            inject: [SQB_MODULE_OPTIONS],
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

        const useClass = options.useClass as Type<SqbOptionsFactory>;
        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: useClass,
                useClass,
            }
        ];
    }

    private static createAsyncOptionsProvider(options: SqbModuleAsyncOptions): Provider {
        if (options.useFactory) {
            return {
                provide: SQB_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        // `as Type<SqbOptionsFactory>` is a workaround for microsoft/TypeScript#31603
        const inject = [
            (options.useClass || options.useExisting) as Type<SqbOptionsFactory>,
        ];
        return {
            provide: SQB_MODULE_OPTIONS,
            useFactory: async (optionsFactory: SqbOptionsFactory) =>
                await optionsFactory.createSqbOptions(options.name),
            inject,
        };
    }

    private static async createConnectionFactory(
        options: SqbModuleOptions,
    ): Promise<SqbClient> {
        const connectionToken = options.name || DEFAULT_CONNECTION_NAME;
        const pipe = defer(async () => {
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
        );
        return await lastValueFrom(pipe);
    }
}
