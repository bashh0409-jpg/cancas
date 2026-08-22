import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

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

function getR2Config() {
  if (!bucketName || !publicUrl) {
    throw new Error("R2 storage is not configured");
  }

  return { bucketName, publicUrl, client: getR2Client() };
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

export async function uploadToR2(
  storagePath: string,
  body: Uint8Array,
  contentType: string,
) {
  const { bucketName: bucket, publicUrl: baseUrl, client } = getR2Config();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storagePath,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=86400",
    }),
  );

  return `${baseUrl}/${storagePath}`;
}

export async function deleteFromR2(storagePath: string) {
  const { bucketName: bucket, client } = getR2Config();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: storagePath,
    }),
  );
}

export async function downloadFromR2(storagePath: string) {
  const { bucketName: bucket, client } = getR2Config();
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: storagePath }),
  );

  if (!response.Body) throw new Error("R2 object has no body");
  return Buffer.from(await response.Body.transformToByteArray());
}

export async function deleteR2Prefix(prefix: string) {
  const { bucketName: bucket, client } = getR2Config();
  let continuationToken: string | undefined;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    const keys = (page.Contents ?? [])
      .map((entry) => entry.Key)
      .filter((key): key is string => Boolean(key));

    if (keys.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        }),
      );
    }

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
}