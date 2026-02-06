import { NextRequest, NextResponse } from 'next/server';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
// @ts-ignore
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile';

const PUBLIC_KEY = process.env.ILOVEPDF_PUBLIC_KEY;
const SECRET_KEY = process.env.ILOVEPDF_SECRET_KEY;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const compressionLevel = formData.get('compressionLevel') as string || 'MEDIUM'; // LOW, MEDIUM, HIGH

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        if (!PUBLIC_KEY || !SECRET_KEY) {
            return NextResponse.json({ error: 'Server configuration error: Missing iLovePDF Keys' }, { status: 500 });
        }

        const instance = new ILovePDFApi(PUBLIC_KEY, SECRET_KEY);
        const task = instance.newTask('compress');

        await task.start();

        // 1. Prepare Buffer & Temp File
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use temp file to avoid TS issues with buffer upload
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${file.name}`);
        fs.writeFileSync(tempFilePath, buffer);

        console.log("1. Add file to iLovePDF task...");
        try {
            await task.addFile(tempFilePath);
        } finally {
            // Cleanup temp file immediately after adding
            fs.unlinkSync(tempFilePath);
        }

        // Map levels:
        // LOW -> minimal compression -> 'low'
        // MEDIUM -> recommended -> 'recommended'
        // HIGH -> extreme -> 'extreme'
        let level = 'recommended';
        switch (compressionLevel.toUpperCase()) {
            case 'LOW':
                level = 'low';
                break;
            case 'HIGH':
                level = 'extreme';
                break;
            case 'MEDIUM':
            default:
                level = 'recommended';
                break;
        }

        console.log(`2. Processing (Level: ${level})...`);
        await task.process({ compression_level: level });

        console.log("3. Downloading...");
        const data = await task.download();

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="compressed_${file.name}"`,
            },
        });

    } catch (error: any) {
        console.error('ILovePDF API ERROR:', error);
        return NextResponse.json(
            { error: error.message || 'Compression failed' },
            { status: 500 }
        );
    }
}
