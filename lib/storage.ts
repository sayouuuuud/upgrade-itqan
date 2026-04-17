import { UTApi } from "uploadthing/server";

// Lazily initialize UTApi so it doesn't throw during Next.js build
// if the UPLOADTHING_SECRET environment variable is missing.
let utapiInstance: UTApi | null = null;

function getUtapi(): UTApi {
    if (!utapiInstance) {
        utapiInstance = new UTApi();
    }
    return utapiInstance;
}

export interface StorageUploadResult {
    url: string;
    key: string;
    name: string;
    size: number;
}

/**
 * Uploads a file buffer to UploadThing.
 * Note: UTApi.uploadFiles expects a File object or an array of Files.
 */
export async function uploadToStorage(
    buffer: Buffer,
    filename: string,
    contentType: string
): Promise<StorageUploadResult> {
    const utapi = getUtapi();
    // Correct way to handle Buffer in environments with File API
    const file = new File([buffer as any], filename, { type: contentType });
    const response = await utapi.uploadFiles(file);

    if (!response.data) {
        throw new Error(response.error?.message || "Upload failed");
    }

    return {
        url: (response.data as any).ufsUrl || response.data.url,
        key: response.data.key,
        name: response.data.name,
        size: response.data.size,
    };
}

/**
 * Deletes a file from UploadThing using its key.
 */
export async function deleteFromStorage(key: string): Promise<{ success: boolean }> {
    const utapi = getUtapi();
    const response = await utapi.deleteFiles(key);
    return { success: response.success };
}

// Export a getter or proxy if someone needs the raw utapi object,
// but since it's an internal utility, exporting default is usually fine if we make it a proxy or just remove it if unused.
// We'll export a getter to maintain compatibility if it was imported.
export default getUtapi;
