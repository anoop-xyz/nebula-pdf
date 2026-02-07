import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // 60 seconds for large files

const API_KEY = process.env.PDF_CO_API_KEY;

export async function POST(req: NextRequest) {
    try {
        // Accept JSON body with fileUrl instead of FormData
        const body = await req.json();
        const { fileUrl, fileName, password } = body;

        if (!fileUrl || !fileName || !password) {
            return NextResponse.json({ error: 'Missing fileUrl, fileName, or password' }, { status: 400 });
        }

        if (!API_KEY) {
            return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
        }

        console.log("1. Fetching file from storage...");

        // Fetch file from R2 storage URL
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file from storage: ${fileResponse.status}`);
        }
        const fileBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(fileBuffer);
        const base64Content = buffer.toString('base64');

        console.log("2. Uploading to PDF.co...");

        // STEP 1: UPLOAD TO TEMP STORAGE
        const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload/base64', {
            method: 'POST',
            headers: { 'x-api-key': API_KEY as string, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file: base64Content,
                name: fileName
            })
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload Failed: ${await uploadResponse.text()}`);
        }

        const uploadData = await uploadResponse.json();
        if (uploadData.error) throw new Error(uploadData.message);

        const tempFileUrl = uploadData.url;
        console.log("3. File uploaded. Applying security...");

        // STEP 2: APPLY SECURITY
        const processResponse = await fetch('https://api.pdf.co/v1/pdf/security/add', {
            method: 'POST',
            headers: { 'x-api-key': API_KEY as string, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: tempFileUrl,
                ownerPassword: password,
                userPassword: password,
                encryptionAlgorithm: "AES_128bit",
                printAllowed: true,
                copyAllowed: false,
                modifyAllowed: false,
                name: `secure_${fileName}`
            })
        });

        if (!processResponse.ok) {
            throw new Error(`Security Add Failed: ${await processResponse.text()}`);
        }

        const processData = await processResponse.json();
        if (processData.error) throw new Error(processData.message);

        const finalUrl = processData.url;
        console.log("4. Security applied. Downloading...");

        // STEP 3: DOWNLOAD & RETURN
        const resultResponse = await fetch(finalUrl);
        const resultBlob = await resultResponse.blob();

        return new NextResponse(resultBlob, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="secure_${fileName}"`,
            },
        });

    } catch (error: any) {
        console.error('SERVER ROUTE ERROR:', error);
        return NextResponse.json(
            { error: error.message || 'Server processing failed' },
            { status: 500 }
        );
    }
}
