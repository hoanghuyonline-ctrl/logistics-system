"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function getPresignedUrl(fileName: string, contentType: string) {
  const fileKey = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: fileKey,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  return { url, fileKey };
}
