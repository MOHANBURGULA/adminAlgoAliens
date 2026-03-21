import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CourseModule } from './module.entity'
import { ModuleDocument } from './module-document.entity'
import { ModuleProgress } from './module-progress.entity'
import { ModulesService } from './modules.service'
import { ModulesController } from './modules.controller'

@Module({
  imports: [TypeOrmModule.forFeature([CourseModule, ModuleDocument, ModuleProgress])],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService]
})
export class ModulesModule {}
