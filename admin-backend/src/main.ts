import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor'

function normalizeUrl(value?: string) {
  return value?.trim().replace(/\/$/, '')
}

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule)
  const allowedOrigins = [
    normalizeUrl(process.env.ADMIN_FRONTEND_URL),
    normalizeUrl(process.env.FRONTEND_URL),
  ].filter((origin): origin is string => Boolean(origin))

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(new RequestLoggingInterceptor())

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })

  const port = process.env.PORT || 3002
  await app.listen(port)
  logger.log(`Admin backend running on port ${port}`)
}
bootstrap()
