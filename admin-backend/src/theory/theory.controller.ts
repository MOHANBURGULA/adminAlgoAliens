import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'
import { TheoryService } from './theory.service'
import { SaveTheoryProgressDto, UploadTheoryDto } from './dto/theory.dto'

@Controller('api/theory')
export class TheoryController {
  constructor(private readonly theoryService: TheoryService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadTheory(
    @Body() body: UploadTheoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.theoryService.uploadTheoryResource(body.moduleId, body.title || '', file)
  }

  @Post('progress')
  @UseGuards(JwtAuthGuard)
  saveProgress(
    @Req() req: any,
    @Body() body: SaveTheoryProgressDto,
  ) {
    return this.theoryService.saveTheoryProgress(req.user.id, body)
  }

  @Get('progress/:moduleId/:userId')
  @UseGuards(JwtAuthGuard)
  getProgress(
    @Req() req: any,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.theoryService.getTheoryProgress(moduleId, userId, req.user)
  }

  @Get(':moduleId')
  @UseGuards(JwtAuthGuard)
  getTheoryByModule(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.theoryService.getTheoryByModule(moduleId)
  }

  @Get(':moduleId/file')
  @UseGuards(JwtAuthGuard)
  async getTheoryFile(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.theoryService.getTheoryFilePayload(moduleId)
    res.setHeader('Content-Type', file.contentType)
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`)
    res.setHeader('Cache-Control', 'private, max-age=60')
    return new StreamableFile(file.buffer)
  }
}
