import { Module } from '@nestjs/common';
import { SqbModule } from '@sqb/nestjs';
import { PhotoModule } from './photo/photo.module';

const dbConfig  = require('./config.json');

@Module({
  imports: [
    SqbModule.forRoot(dbConfig),
    PhotoModule
  ]
})
export class ApplicationModule {}
