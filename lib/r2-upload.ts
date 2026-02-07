export interface UploadProgress {
    progress: number;
    status: 'uploading' | 'complete' | 'error';
}

export interface R2UploadResult {
    publicUrl: string;
    key: string;
}

/**
 * Upload a file to Cloudflare R2 using presigned URLs
 * @param file - File to upload
 * @param userId - User ID for path organization
 * @param onProgress - Optional progress callback
 * @returns Public URL and key for the uploaded file
 */
export async function uploadToR2(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<R2UploadResult> {
    try {
        onProgress?.({ progress: 5, status: 'uploading' });

        // Step 1: Get presigned URL from our API
        const presignResponse = await fetch('/api/r2-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                userId,
            }),
        });

        if (!presignResponse.ok) {
            const error = await presignResponse.json();
            throw new Error(error.error || 'Failed to get upload URL');
        }

        const { uploadUrl, publicUrl, key } = await presignResponse.json();
        onProgress?.({ progress: 15, status: 'uploading' });

        // Step 2: Upload directly to R2 using presigned URL
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        onProgress?.({ progress: 100, status: 'complete' });
        return { publicUrl, key };

    } catch (error: any) {
        onProgress?.({ progress: 0, status: 'error' });
        throw error;
    }
}

/**
 * Delete a file from R2 (cleanup after processing)
 * @param key - The R2 object key to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
    try {
        await fetch('/api/r2-upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
        });
    } catch (error) {
        console.warn('Failed to delete temp file from R2:', error);
        // Don't throw - cleanup failures shouldn't break the flow
    }
}

/**
 * Validate file is a PDF and within size limits
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default 100MB)
 */
export function validatePDFFile(file: File, maxSizeMB: number = 100): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (file.type !== 'application/pdf') {
        return { valid: false, error: 'File must be a PDF document' };
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
        return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    return { valid: true };
}
