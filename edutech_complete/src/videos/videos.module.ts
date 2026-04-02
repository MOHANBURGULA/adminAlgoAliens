import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Video } from './video.entity'
import { VideosController } from './videos.controller'
import { VideosService } from './videos.service'
import { S3Module } from '../s3/s3.module'
import { ActivityModule } from '../activity/activity.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    MulterModule.register({ storage: memoryStorage() }),
    S3Module,
    ActivityModule,
  ],
  controllers: [VideosController],
  providers: [VideosService]
})
export class VideosModule {}
