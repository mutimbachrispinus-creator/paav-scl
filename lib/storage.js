/**
 * EduVantage Storage Core — Cloudflare R2 (Native Fetch)
 * 
 * Replaces @aws-sdk/client-s3 to reduce server bundle size.
 * Uses standard fetch with pre-configured R2 endpoint.
 */

const bucketName = process.env.BACKUP_S3_BUCKET_NAME;
const endpoint = process.env.BACKUP_S3_ENDPOINT; // e.g. https://<id>.r2.cloudflarestorage.com
const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY;

/**
 * Upload a backup file to R2 using native fetch.
 * Note: For production, this should use a signed request or a worker proxy.
 * If using Cloudflare Pages, you can also use R2 Bindings.
 */
export async function uploadBackup(filename, content) {
  if (!endpoint || !bucketName) {
    console.error('R2 configuration missing.');
    return { error: 'R2 configuration missing' };
  }

  try {
    const url = `${endpoint}/${bucketName}/backups/${filename}`;
    
    // In a real R2 setup, you'd use the S3 API with signing.
    // However, to keep the bundle tiny, we can use a Worker proxy or a pre-signed URL approach.
    // For this implementation, we'll assume the endpoint is a secure proxy or 
    // we use a simplified fetch if the bucket allows it (not recommended for backups).
    
    // BEST PRACTICE for Cloudflare: Use R2 Bindings if possible.
    // If not, use a small signing library like 'aws4fetch' (which is ~4kb).
    
    const response = await fetch(url, {
      method: 'PUT',
      body: content,
      headers: {
        'Content-Type': 'application/json',
        // In a real scenario, you'd add Authorization headers here.
        'X-Custom-Auth': secretAccessKey // Simple example if using a proxy
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return { success: true };
  } catch (err) {
    console.error('R2 upload error:', err);
    return { error: err.message };
  }
}
