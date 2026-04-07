import { BadRequestException, Injectable } from '@nestjs/common'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'

const MAX_SIGNED_URL_TTL_SECONDS = 3600

@Injectable()
export class S3Service {
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly endpoint: string
  private readonly region: string

  constructor() {
    this.bucket = process.env.S3_BUCKET?.trim() || 'algo-aliens'
    this.endpoint = process.env.S3_ENDPOINT?.trim() || 'https://s3.us-east-005.backblazeb2.com'
    this.region = this.resolveRegion(
      process.env.S3_REGION?.trim() || 'auto',
      this.endpoint,
    )

    this.s3 = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: true,
    })
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    prefix?: string,
  ): Promise<string> {
    const key = this.createObjectKey(originalName, prefix)

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    )

    return key
  }

  async generateUploadUrl(
    originalName: string,
    contentType?: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = this.createObjectKey(originalName)
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(contentType ? { ContentType: contentType } : {}),
    })

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: MAX_SIGNED_URL_TTL_SECONDS,
    })

    return { uploadUrl, key }
  }

  async getDownloadUrl(value: string, expiresIn = MAX_SIGNED_URL_TTL_SECONDS) {
    const normalizedValue = this.normalizeStoredKey(value, 'file key')

    if (this.isHttpUrl(normalizedValue)) {
      return normalizedValue
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: normalizedValue,
    })

    return getSignedUrl(this.s3, command, {
      expiresIn: Math.min(expiresIn, MAX_SIGNED_URL_TTL_SECONDS),
    })
  }

  async getFile(value: string) {
    const key = this.normalizeStoredKey(value, 'file key')

    if (this.isHttpUrl(key)) {
      throw new BadRequestException('Only managed storage object keys can be downloaded directly.')
    }

    return this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )
  }

  normalizeStoredKey(value: string, label = 'file key') {
    const normalizedValue = value?.trim()
    if (!normalizedValue) {
      throw new BadRequestException(`A valid ${label} is required.`)
    }

    if (!this.isHttpUrl(normalizedValue)) {
      return this.sanitizeObjectKey(normalizedValue, label)
    }

    const managedKey = this.extractManagedObjectKey(normalizedValue)
    if (managedKey) {
      return this.sanitizeObjectKey(managedKey, label)
    }

    return normalizedValue
  }

  private createObjectKey(originalName: string, prefixPath?: string) {
    const normalizedName = originalName.replace(/\\/g, '/').trim()
    const pathSegments = normalizedName.split('/').filter(Boolean)
    const filename = pathSegments[pathSegments.length - 1] || 'file'
    const sanitizedFilename = filename.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-')
    const extensionSafeName = sanitizedFilename.replace(/^-+|-+$/g, '') || 'file'
    const explicitPrefix = prefixPath?.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
    const derivedPrefix =
      pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') : ''
    const prefix = explicitPrefix || derivedPrefix

    return [prefix, `${randomUUID()}-${extensionSafeName}`].filter(Boolean).join('/')
  }

  private extractManagedObjectKey(urlValue: string) {
    try {
      const parsedUrl = new URL(urlValue)
      const normalizedPath = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/, '')
      const pathSegments = normalizedPath.split('/').filter(Boolean)

      if (pathSegments.length === 0) {
        return null
      }

      if (pathSegments[0] === this.bucket) {
        return pathSegments.slice(1).join('/')
      }

      const bucketHostPrefix = `${this.bucket}.`
      if (parsedUrl.hostname.startsWith(bucketHostPrefix)) {
        return pathSegments.join('/')
      }

      const bucketIndex = pathSegments.indexOf(this.bucket)
      if (bucketIndex >= 0) {
        return pathSegments.slice(bucketIndex + 1).join('/')
      }

      const endpointHost = this.getHostname(this.endpoint)
      if (endpointHost && parsedUrl.hostname === endpointHost && pathSegments.length > 1) {
        return pathSegments.slice(1).join('/')
      }

      return null
    } catch {
      return null
    }
  }

  private sanitizeObjectKey(value: string, label: string) {
    const normalizedValue = value
      .replace(/\\/g, '/')
      .replace(/\?.*$/, '')
      .replace(/#.*$/, '')
      .replace(/^\/+/, '')
      .replace(/\/{2,}/g, '/')
      .trim()

    if (
      !normalizedValue ||
      normalizedValue === '.' ||
      normalizedValue === '..' ||
      normalizedValue.split('/').some((segment) => !segment || segment === '.' || segment === '..')
    ) {
      throw new BadRequestException(`A valid ${label} is required.`)
    }

    return normalizedValue
  }

  private getHostname(value: string) {
    try {
      return new URL(value).hostname
    } catch {
      return ''
    }
  }

  private resolveRegion(configuredRegion: string, endpointValue: string) {
    if (configuredRegion && configuredRegion.toLowerCase() !== 'auto') {
      return configuredRegion
    }

    const endpointHost = this.getHostname(endpointValue)
    const backblazeMatch = endpointHost.match(/^s3\.([a-z0-9-]+)\.backblazeb2\.com$/i)
    if (backblazeMatch?.[1]) {
      return backblazeMatch[1]
    }

    return configuredRegion || 'auto'
  }

  private isHttpUrl(value: string) {
    return /^https?:\/\//i.test(value)
  }
}
