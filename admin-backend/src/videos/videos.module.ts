import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Video } from './video.entity'
import { VideosController } from './videos.controller'
import { VideosService } from './videos.service'
import { S3Module } from '../s3/s3.module'
import { RedisModule } from '../redis/redis.module'

// UPDATED — RedisModule added for RedisMetricsService (already used in VideosService)
@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    MulterModule.register({ storage: memoryStorage() }),
    S3Module,
    RedisModule,
  ],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
