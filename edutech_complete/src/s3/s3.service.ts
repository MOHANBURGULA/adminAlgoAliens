import { Injectable } from '@nestjs/common'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class S3Service {

  private client: S3Client
  private bucket: string

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'algo-aliens'

    this.client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || ''
      },
      forcePathStyle: true
    })
  }

  // Upload a file (used for ZIP files and videos from backend)
  async uploadFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const uploaded = await this.uploadFileAtPath('', buffer, originalName, mimeType)
    return uploaded.fileUrl
  }

  async uploadFileAtPath(
    prefix: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ key: string; fileUrl: string }> {
    const sanitizedPrefix = prefix.trim().replace(/^\/+|\/+$/g, '')
    const safeName = originalName.replace(/\s+/g, '-')
    const key = sanitizedPrefix
      ? `${sanitizedPrefix}/${uuidv4()}-${safeName}`
      : `${uuidv4()}-${safeName}`

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    )

    return {
      key,
      fileUrl: this.getPublicUrl(key),
    }
  }

  // List all files in the bucket
  async listFiles(): Promise<any[]> {
    const result = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket })
    )
    return result.Contents || []
  }

  // Download / get a file by key
  async getFile(key: string): Promise<any> {
    return this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    )
  }

  // Delete a file by key
  async deleteFile(key: string): Promise<any> {
    return this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    )
  }

  // Generate a presigned URL so the frontend can upload directly to S3
  // (client uploads without going through the backend server)
  async generateUploadUrl(originalName: string): Promise<{ uploadUrl: string; key: string }> {
    const key = `${uuidv4()}-${originalName}`

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key
    })

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 })

    return { uploadUrl, key }
  }

  getPublicUrl(key: string) {
    const endpoint = (process.env.S3_ENDPOINT || '').replace(/\/+$/, '')
    return `${endpoint}/${this.bucket}/${key}`
  }

}
