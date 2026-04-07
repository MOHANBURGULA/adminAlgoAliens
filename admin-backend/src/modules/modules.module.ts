import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CourseModule } from './module.entity'
import { ModuleActivity } from './module-activity.entity'
import { ModuleDocument } from './module-document.entity'
import { ModuleProgress } from './module-progress.entity'
import { ModulesService } from './modules.service'
import { ModulesController } from './modules.controller'
import { S3Module } from '../s3/s3.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseModule, ModuleActivity, ModuleDocument, ModuleProgress]),
    S3Module,
  ],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService]
})
export class ModulesModule {}
