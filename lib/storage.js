import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const region = process.env.BACKUP_S3_REGION || "auto";
const endpoint = process.env.BACKUP_S3_ENDPOINT; // e.g. https://<id>.r2.cloudflarestorage.com
const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY;
const bucketName = process.env.BACKUP_S3_BUCKET_NAME;

const s3Client = accessKeyId && secretAccessKey ? new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
}) : null;

/**
 * Upload a backup file to S3/R2.
 * @param {string} filename - Name of the file in the bucket
 * @param {string} content  - File content (string or Buffer)
 */
export async function uploadBackup(filename, content) {
  if (!s3Client || !bucketName) {
    console.error('S3/R2 credentials missing. Backup not uploaded.');
    return { error: 'S3/R2 credentials missing' };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `backups/${filename}`,
      Body: content,
      ContentType: "application/json",
    });

    await s3Client.send(command);
    return { success: true };
  } catch (err) {
    console.error('S3 upload error:', err);
    return { error: err.message };
  }
}
