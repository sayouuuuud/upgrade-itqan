import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

// Cloudinary config for backward compatibility (deleting old files)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// AWS S3 config for all new uploads
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

export interface StorageUploadResult {
    url: string;
    key: string;
    name: string;
    size: number;
}

/**
 * Uploads a file to AWS S3.
 * Accepts a Web File object (preferred) or a Buffer.
 */
export async function uploadToStorage(
    fileOrBuffer: File | Buffer,
    filename: string, // fallback or explicitly requested name
    contentType: string // fallback type
): Promise<StorageUploadResult> {
    let buffer: Buffer;

    if (typeof File !== 'undefined' && fileOrBuffer instanceof File) {
        buffer = Buffer.from(await fileOrBuffer.arrayBuffer());
    } else {
        buffer = fileOrBuffer as Buffer;
    }

    // Generate a unique S3 key to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Remove any special characters to keep the S3 key clean
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `uploads/${uniqueSuffix}-${sanitizedFilename}`;

    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            // Depending on the bucket policy, you might not need ACLs. 
            // Most modern AWS accounts disable ACLs and use Bucket Policies for public read.
        }));

        // Construct the public URL for AWS S3
        const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        return {
            url,
            key,
            name: filename,
            size: buffer.length,
        };
    } catch (error: any) {
        console.error("[S3] Upload Error:", error);
        throw new Error(error.message || "فشل الرفع إلى S3");
    }
}

/**
 * Deletes a file from S3 (if new) or Cloudinary (if old) using its key.
 */
export async function deleteFromStorage(key: string): Promise<{ success: boolean }> {
    try {
        // If the key starts with 'uploads/', it is our new S3 file
        if (key.startsWith('uploads/')) {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            }));
            return { success: true };
        }

        // Otherwise, it's likely an old file stored in Cloudinary (e.g., 'itqaan-academy/...')
        let result = await cloudinary.uploader.destroy(key, { invalidate: true });

        if (result.result === 'not found') {
            // If not found, it might be a video or audio, so try deleting as video
            result = await cloudinary.uploader.destroy(key, { invalidate: true, resource_type: 'video' });
        }

        // We return true if it deleted successfully or wasn't found anyway
        return { success: result.result === 'ok' || result.result === 'not found' };
    } catch (e) {
        console.error("[Storage] Delete Error:", e);
        return { success: false };
    }
}
