import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

export function isR2Configured() {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      bucketName &&
      publicUrl,
  );
}

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("R2 storage is not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function createR2UploadUrl(
  storagePath: string,
  contentType: string,
) {
  if (!bucketName || !publicUrl) {
    throw new Error("R2 storage is not configured");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: storagePath,
    ContentType: contentType,
    CacheControl: "public, max-age=86400",
  });

  return {
    uploadUrl: await getSignedUrl(getR2Client(), command, { expiresIn: 900 }),
    publicUrl: `${publicUrl}/${storagePath}`,
  };
}