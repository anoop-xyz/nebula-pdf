import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.PDF_CO_API_KEY as string;

if (!API_KEY) {
    console.error("PDF_CO_API_KEY is not defined in environment variables");
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Content = buffer.toString('base64');

        console.log("1. Uploading file to PDF.co for compression...");

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

        // STEP 2: OPTIMIZE (COMPRESS)
        console.log("3. Sending optimize request...");
        const processResponse = await fetch('https://api.pdf.co/v1/pdf/optimize', {
            method: 'POST',
            headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: tempFileUrl,
                name: `compressed_${file.name}`,
                async: false, // Wait for result
                // Optional optimization parameters
                // "jpegQuality": 25, 
                // "resample": true
            })
        });

        if (!processResponse.ok) {
            throw new Error(`Compression Failed: ${await processResponse.text()}`);
        }

        const processData = await processResponse.json();
        if (processData.error) throw new Error(processData.message);

        const finalUrl = processData.url;
        console.log("4. Compression done. Downloading from:", finalUrl);

        // STEP 3: DOWNLOAD & RETURN
        const fileResponse = await fetch(finalUrl);
        const resultBlob = await fileResponse.blob();

        return new NextResponse(resultBlob, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="compressed_${file.name}"`,
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
