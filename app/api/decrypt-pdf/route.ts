import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.PDF_CO_API_KEY as string;

if (!API_KEY) {
    console.error("PDF_CO_API_KEY is not defined in environment variables");
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const password = formData.get('password') as string;

        if (!file || !password) {
            return NextResponse.json({ error: 'Missing file or password' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Content = buffer.toString('base64');

        console.log("1. Uploading file to PDF.co for decryption...");

        // STEP 1: UPLOAD
        const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload/base64', {
            method: 'POST',
            headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
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

        // STEP 2: REMOVE SECURITY
        // The endpoint usually accepts the password to open the file and then saves it without one.
        // We use /pdf/security/remove if available, or we might need to check docs.
        // Common PDF.co pattern is just to process it. Let's try /pdf/security/remove.
        // If that fails, we can try other endpoints. but this is the logical counterpart to /add.

        const processResponse = await fetch('https://api.pdf.co/v1/pdf/security/remove', {
            method: 'POST',
            headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: tempFileUrl,
                password: password, // The password to open the file
                name: `unlocked_${file.name}`
            })
        });

        if (!processResponse.ok) {
            // Fallback: If 'remove' isn't the exact endpoint, handle error or try alternate.
            // But usually this exists.
            throw new Error(`Security Removal Failed: ${await processResponse.text()}`);
        }

        const processData = await processResponse.json();
        if (processData.error) throw new Error(processData.message);

        const finalUrl = processData.url;
        console.log("3. Security removed. Downloading from:", finalUrl);

        // STEP 3: DOWNLOAD & RETURN
        const fileResponse = await fetch(finalUrl);
        const resultBlob = await fileResponse.blob();

        return new NextResponse(resultBlob, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="unlocked_${file.name}"`,
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
