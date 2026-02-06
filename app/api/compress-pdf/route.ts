import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.PDF_CO_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const compressionLevel = formData.get('compressionLevel') as string || 'MEDIUM'; // LOW, MEDIUM, HIGH

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        if (!API_KEY) {
            return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
        }

        // 1. Prepare Base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Content = buffer.toString('base64');

        console.log("1. Uploading file to PDF.co for compression...");

        // STEP 1: UPLOAD TO TEMP STORAGE
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

        // STEP 2: COMPRESS PDF
        // PDF.co Compression Profile suggestions:
        // We can use 'mode' or specific profiles. 
        // For simplicity, we'll mapping our Levels to PDF.co logic or just use default optimized.

        console.log(`3. CSS Compressing (Level: ${compressionLevel})...`);

        const compressResponse = await fetch('https://api.pdf.co/v1/pdf/compress', {
            method: 'POST',
            headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: tempFileUrl,
                name: `compressed_${file.name}`,
                async: false
            })
        });

        if (!compressResponse.ok) {
            const errorText = await compressResponse.text();
            throw new Error(`Compression Failed: ${errorText}`);
        }

        const compressData = await compressResponse.json();
        if (compressData.error) throw new Error(compressData.message);

        const finalUrl = compressData.url;
        console.log("4. Compression result URL:", finalUrl);

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
        console.error('PDF.CO API ERROR:', error);
        return NextResponse.json(
            { error: error.message || 'Compression failed' },
            { status: 500 }
        );
    }
}
