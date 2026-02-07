import { NextRequest, NextResponse } from 'next/server';

// For App Router - increase timeout for large file processing
export const maxDuration = 60; // 60 seconds

const PUBLIC_KEY = process.env.ILovePDF_PUBLIC_KEY;
const SECRET_KEY = process.env.ILovePDF_SECRET_KEY;

export async function POST(req: NextRequest) {
    try {
        // Accept JSON body with fileUrl instead of FormData
        const body = await req.json();
        const { fileUrl, fileName, compressionLevel = 'MEDIUM' } = body;

        if (!fileUrl || !fileName) {
            return NextResponse.json({ error: 'Missing fileUrl or fileName' }, { status: 400 });
        }

        if (!PUBLIC_KEY || !SECRET_KEY) {
            return NextResponse.json({ error: 'Server configuration error: Missing iLovePDF Keys' }, { status: 500 });
        }

        // Map compression levels
        let level = 'recommended';
        switch (compressionLevel.toUpperCase()) {
            case 'LOW': level = 'low'; break;
            case 'HIGH': level = 'extreme'; break;
            default: level = 'recommended'; break;
        }

        console.log("iLovePDF: Starting compression task...");
        console.log("File URL:", fileUrl.substring(0, 100) + "...");

        // STEP 1: Start Task - Get server and task ID
        const startResponse = await fetch('https://api.ilovepdf.com/v1/start/compress', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${await getJWT(PUBLIC_KEY, SECRET_KEY)}`
            }
        });

        if (!startResponse.ok) {
            const errText = await startResponse.text();
            console.error("Start Task Error:", errText);
            throw new Error(`Failed to start task: ${errText}`);
        }

        const startData = await startResponse.json();
        const { server, task } = startData;
        console.log("iLovePDF: Task started on server:", server, "Task ID:", task);

        // STEP 2: Upload File from URL
        // Fetch the file from Firebase Storage URL
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file from storage: ${fileResponse.status}`);
        }
        const fileBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(fileBuffer);

        const uploadFormData = new FormData();
        uploadFormData.append('task', task);
        uploadFormData.append('file', new Blob([buffer]), fileName);

        const uploadResponse = await fetch(`https://${server}/v1/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${await getJWT(PUBLIC_KEY, SECRET_KEY)}`
            },
            body: uploadFormData
        });

        if (!uploadResponse.ok) {
            const errText = await uploadResponse.text();
            console.error("Upload Error:", errText);
            throw new Error(`Failed to upload file: ${errText}`);
        }

        const uploadData = await uploadResponse.json();
        const serverFilename = uploadData.server_filename;
        console.log("iLovePDF: File uploaded, server_filename:", serverFilename);

        // STEP 3: Process (Compress)
        const processResponse = await fetch(`https://${server}/v1/process`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${await getJWT(PUBLIC_KEY, SECRET_KEY)}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                task: task,
                tool: 'compress',
                files: [{ server_filename: serverFilename, filename: fileName }],
                compression_level: level
            })
        });

        if (!processResponse.ok) {
            const errText = await processResponse.text();
            console.error("Process Error:", errText);
            throw new Error(`Failed to process file: ${errText}`);
        }

        console.log("iLovePDF: Processing complete. Downloading...");

        // STEP 4: Download
        const downloadResponse = await fetch(`https://${server}/v1/download/${task}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${await getJWT(PUBLIC_KEY, SECRET_KEY)}`
            }
        });

        if (!downloadResponse.ok) {
            const errText = await downloadResponse.text();
            console.error("Download Error:", errText);
            throw new Error(`Failed to download file: ${errText}`);
        }

        const resultBlob = await downloadResponse.blob();
        console.log("iLovePDF: Download complete. Size:", resultBlob.size);

        return new NextResponse(resultBlob, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="compressed_${fileName}"`,
            },
        });

    } catch (error: any) {
        console.error('iLovePDF API ERROR:', error);
        return NextResponse.json(
            { error: error.message || 'Compression failed' },
            { status: 500 }
        );
    }
}

// Helper function to generate JWT for iLovePDF API
async function getJWT(publicKey: string, secretKey: string): Promise<string> {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        iss: 'ilovepdf',
        iat: Math.floor(Date.now() / 1000),
        jti: publicKey
    })).toString('base64url');

    const crypto = require('crypto');
    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(`${header}.${payload}`)
        .digest('base64url');

    return `${header}.${payload}.${signature}`;
}
