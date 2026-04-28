import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface StorageUploadResult {
    url: string;
    key: string;
    name: string;
    size: number;
}

/**
 * Uploads a file to Cloudinary.
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

    // Cloudinary needs resource_type: 'video' for both video and audio files
    const isVideoOrAudio = contentType.startsWith('video/') || contentType.startsWith('audio/');
    const resourceType = isVideoOrAudio ? 'video' : 'auto';

    // Remove extension for public_id as Cloudinary adds it automatically based on format
    const publicId = filename.replace(/\.[^/.]+$/, "");

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                public_id: publicId
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error) {
                    console.error("[Cloudinary] Upload Error:", error);
                    return reject(new Error(error.message));
                }

                if (result) {
                    resolve({
                        url: result.secure_url,
                        key: result.public_id, // Important for deletion
                        name: filename,
                        size: result.bytes,
                    });
                } else {
                    reject(new Error("Unknown error during upload"));
                }
            }
        );
        stream.end(buffer);
    });
}

/**
 * Deletes a file from Cloudinary using its key.
 */
export async function deleteFromStorage(key: string): Promise<{ success: boolean }> {
    try {
        // Attempt to delete it as image first (default)
        let result = await cloudinary.uploader.destroy(key, { invalidate: true });

        if (result.result === 'not found') {
            // If not found, it might be a video or audio, so try deleting as video
            result = await cloudinary.uploader.destroy(key, { invalidate: true, resource_type: 'video' });
        }

        return { success: result.result === 'ok' };
    } catch (e) {
        console.error("[Cloudinary] Delete Error:", e);
        return { success: false };
    }
}
