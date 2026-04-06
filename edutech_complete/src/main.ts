import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as dotenv from 'dotenv'
import { AppModule } from './app.module'
import { featureFlags } from './config/feature-flags'
import { waitForJudge0Startup } from './execution/judge0-startup'
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter'

dotenv.config()

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule)

  logger.log(`Admin feature is ${featureFlags.enableAdmin ? 'enabled' : 'disabled'}`)

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )
  app.useGlobalFilters(new AllExceptionsFilter())

  await waitForJudge0Startup()
  await app.listen(3001)
  logger.log('Backend is listening on http://localhost:3001')
}
bootstrap()
