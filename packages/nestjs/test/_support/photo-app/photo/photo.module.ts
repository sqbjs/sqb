import '@sqb/postgres';
import { Module } from '@nestjs/common';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';

@Module({
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
