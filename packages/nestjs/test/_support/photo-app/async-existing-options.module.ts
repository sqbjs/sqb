import {Module} from '@nestjs/common';
import {
    SqbModule,
    SqbModuleOptions,
    SqbOptionsFactory,
} from '@sqb/nestjs';
import {PhotoModule} from './photo/photo.module';

const dbConfig = require('./config.json');

class ConfigService implements SqbOptionsFactory {
    createSqbOptions(): SqbModuleOptions {
        return dbConfig;
    }
}

@Module({
    providers: [ConfigService],
    exports: [ConfigService],
})
class ConfigModule {
}

@Module({
    imports: [
        SqbModule.forRootAsync({
            imports: [ConfigModule],
            name: 'db1',
            useExisting: ConfigService,
        }),
        PhotoModule,
    ]
})
export class AsyncOptionsExistingModule {
}
