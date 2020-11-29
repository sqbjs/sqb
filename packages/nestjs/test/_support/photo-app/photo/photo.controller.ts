import { Controller, Get, Post } from '@nestjs/common';
import { PhotoService } from './photo.service';

@Controller('photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Get()
  findAll(): Promise<any[]> {
    return this.photoService.findAll();
  }

  @Post()
  create(): Promise<any> {
    return this.photoService.create();
  }
}
