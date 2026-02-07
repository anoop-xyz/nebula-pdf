import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebula-pdf-uploads';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://pub-xxxx.r2.dev

// Initialize S3 client for R2
const getR2Client = () => {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
        throw new Error('Missing R2 configuration');
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
};

// Generate presigned URL for upload
export async function POST(req: NextRequest) {
    try {
        const { fileName, fileType, userId } = await req.json();

        if (!fileName || !fileType) {
            return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'User must be authenticated' }, { status: 401 });
        }

        // Validate file type
        if (fileType !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 });
        }

        const r2Client = getR2Client();

        // Create unique key: temp/{userId}/{timestamp}_{filename}
        const timestamp = Date.now();
        const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `temp/${userId}/${timestamp}_${safeName}`;

        // Generate presigned upload URL (valid for 10 minutes)
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 });

        // Public URL for reading (R2 public access)
        const publicUrl = `${R2_PUBLIC_URL}/${key}`;

        return NextResponse.json({
            uploadUrl,    // URL to PUT the file
            publicUrl,    // URL to GET the file after upload
            key,          // Key for deletion later
        });

    } catch (error: any) {
        console.error('R2 presign error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate upload URL' },
            { status: 500 }
        );
    }
}

// Delete file from R2 (cleanup)
export async function DELETE(req: NextRequest) {
    try {
        const { key } = await req.json();

        if (!key) {
            return NextResponse.json({ error: 'Missing key' }, { status: 400 });
        }

        const r2Client = getR2Client();

        await r2Client.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        }));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('R2 delete error:', error);
        // Don't fail the request - cleanup is best effort
        return NextResponse.json({ success: false, error: error.message });
    }
}
