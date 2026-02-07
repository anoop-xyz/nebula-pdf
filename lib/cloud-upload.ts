import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgress {
    progress: number;
    status: 'uploading' | 'complete' | 'error';
}

/**
 * Upload a file to Firebase Storage
 * @param file - File to upload
 * @param userId - User ID for path organization
 * @param onProgress - Optional progress callback
 * @returns Download URL of the uploaded file
 */
export async function uploadToCloud(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; path: string }> {
    // Create unique path: temp-uploads/{userId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `temp-uploads/${userId}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, path);

    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
        });

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.({ progress, status: 'uploading' });
            },
            (error) => {
                console.error('Upload error:', error);
                onProgress?.({ progress: 0, status: 'error' });
                reject(new Error(`Upload failed: ${error.message}`));
            },
            async () => {
                try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    onProgress?.({ progress: 100, status: 'complete' });
                    resolve({ url, path });
                } catch (error: any) {
                    reject(new Error(`Failed to get download URL: ${error.message}`));
                }
            }
        );
    });
}

/**
 * Delete a file from Firebase Storage
 * @param path - Storage path of the file to delete
 */
export async function deleteFromCloud(path: string): Promise<void> {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        console.log('Temp file deleted:', path);
    } catch (error: any) {
        // Don't throw - cleanup failures shouldn't break the flow
        console.warn('Failed to delete temp file:', path, error.message);
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
