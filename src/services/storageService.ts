import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { config as appConfig } from "../config/env";

const r2Endpoint = appConfig.r2AccountId
  ? `https://${appConfig.r2AccountId}.r2.cloudflarestorage.com`
  : undefined;

const s3 = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials:
    appConfig.r2AccessKeyId && appConfig.r2SecretAccessKey
      ? {
          accessKeyId: appConfig.r2AccessKeyId,
          secretAccessKey: appConfig.r2SecretAccessKey,
        }
      : undefined,
});

const bucket = appConfig.r2Bucket;

export class StorageService {
  /**
   * Upload an artifact to Cloudflare R2 and return its public URL.
   *
   * Note: Although this accepts a Buffer (to match the caller API),
   * it streams the data to R2 via a Readable stream to avoid buffering
   * a second time inside the SDK.
   */
  async uploadArtifact(buffer: Buffer, key: string, contentType: string): Promise<string> {
    if (!bucket || !r2Endpoint) {
      throw new Error("R2 storage is not configured");
    }

    const body = Readable.from(buffer);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );

    const baseUrl = appConfig.r2PublicUrl ?? `${r2Endpoint}/${bucket}`;
    return `${baseUrl}/${encodeURIComponent(key)}`;
  }

  async downloadArtifact(key: string): Promise<Buffer> {
    if (!bucket) {
      throw new Error("R2 storage is not configured");
    }

    const resp = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const stream = resp.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    return Buffer.concat(chunks);
  }

  async deleteArtifact(key: string): Promise<void> {
    if (!bucket) {
      return;
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  }
}

