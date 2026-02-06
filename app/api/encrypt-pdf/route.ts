import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.PDF_CO_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const password = formData.get('password') as string;

        if (!file || !password) {
            return NextResponse.json({ error: 'Missing file or password' }, { status: 400 });
        }

        // 1. Prepare Base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Content = buffer.toString('base64');

        // We must prepend the data URI scheme for the upload endpoint to recognize it correctly
        // or sometimes raw works, but data URI is safer for file type detection.
        // Let's try raw first as per standard docs, but file name is important.

        console.log("1. Uploading file to PDF.co...");

        // STEP 1: UPLOAD TO TEMP STORAGE
        const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload/base64', {
            method: 'POST',
            headers: { 'x-api-key': API_KEY as string, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file: base64Content,
                name: file.name
            })
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload Failed: ${await uploadResponse.text()}`);
        }

        const uploadData = await uploadResponse.json();
        if (uploadData.error) throw new Error(uploadData.message);

        const tempFileUrl = uploadData.url;
        console.log("2. File uploaded. Temp URL:", tempFileUrl);

        // STEP 2: APPLY SECURITY
        const processResponse = await fetch('https://api.pdf.co/v1/pdf/security/add', {
            method: 'POST',
            headers: { 'x-api-key': API_KEY as string, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: tempFileUrl, // Using the URL we just got
                ownerPassword: password,
                userPassword: password,
                encryptionAlgorithm: "AES_128bit",
                printAllowed: true,
                copyAllowed: false,
                modifyAllowed: false,
                name: `secure_${file.name}`
            })
        });

        if (!processResponse.ok) {
            throw new Error(`Security Add Failed: ${await processResponse.text()}`);
        }

        const processData = await processResponse.json();
        if (processData.error) throw new Error(processData.message);

        const finalUrl = processData.url;
        console.log("3. Security applied. Downloading from:", finalUrl);

        // STEP 3: DOWNLOAD & RETURN
        const fileResponse = await fetch(finalUrl);
        const resultBlob = await fileResponse.blob();

        return new NextResponse(resultBlob, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="secure_${file.name}"`,
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
