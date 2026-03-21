import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Video } from './video.entity'

@Injectable()
export class VideosService {

  constructor(
    @InjectRepository(Video)
    private videosRepository: Repository<Video>
  ) {}

  upload(userId: number, data: any) {
    const video = this.videosRepository.create({ userId, ...data, status: 'under_review' })
    return this.videosRepository.save(video)
  }

  getUserVideos(userId: number) {
    return this.videosRepository.find({ where: { userId } })
  }

}
