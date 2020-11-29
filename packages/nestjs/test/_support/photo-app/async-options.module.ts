import {Module} from '@nestjs/common';
import {SqbModule} from '@sqb/nestjs';
import {PhotoModule} from './photo/photo.module';

const dbConfig = require('./config.json');

@Module({
    imports: [
        SqbModule.forRootAsync({
            name: 'db1',
            useFactory: () => (dbConfig),
        }),
        PhotoModule,
    ],
})
export class AsyncOptionsFactoryModule {
}
