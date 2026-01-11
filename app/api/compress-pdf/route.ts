import { NextRequest, NextResponse } from 'next/server';
import {
    PDFServices,
    ServicePrincipalCredentials,
    MimeType,
    CompressPDFJob,
    CompressPDFParams,
    CompressPDFResult,
    SDKError,
    ServiceUsageError,
    ServiceApiError
} from '@adobe/pdfservices-node-sdk';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const compressionLevel = formData.get('compressionLevel') as string || 'MEDIUM'; // LOW, MEDIUM, HIGH

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        // 1. Prepare Credentials
        const credentialsFilePath = path.join(process.cwd(), 'pdfservices-api-credentials.json');

        let credentials;
        try {
            // Read the file manually to ensure we can parse it, or pass path to SDK
            // The SDK usually takes the client_id/secret directly or a file path.
            // Let's rely on the SDK's file builder if possible, strictly following typical patterns.
            // Updating to use ServicePrincipalCredentials directly with the config object if file issues arise,
            // but file is standard.
            const credsConfig = JSON.parse(fs.readFileSync(credentialsFilePath, 'utf-8'));
            credentials = new ServicePrincipalCredentials({
                clientId: credsConfig.client_credentials.client_id,
                clientSecret: credsConfig.client_credentials.client_secret
            });
        } catch (e) {
            console.error("Credential Load Error:", e);
            return NextResponse.json({ error: 'Failed to load Adobe credentials' }, { status: 500 });
        }

        const pdfServices = new PDFServices({ credentials });

        // 2. Prepare Input Stream
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const readStream = new Readable();
        readStream.push(buffer);
        readStream.push(null);

        const inputAsset = await pdfServices.upload({
            readStream,
            mimeType: MimeType.PDF
        });

        // 3. Configure Compression
        // Note: Import CompressionLevel if available, or map to strings if allowed.
        // The SDK defines CompressionLevel enum typically. 
        // Assuming we need to import it or use string "LOW", "MEDIUM", "HIGH" if SDK supports it.
        // Let's safe bet: use the params object but verify enum.

        let level;
        switch (compressionLevel.toUpperCase()) {
            case 'LOW':
                level = 'LOW';
                break;
            case 'HIGH':
                level = 'HIGH';
                break;
            case 'MEDIUM':
            default:
                level = 'MEDIUM';
                break;
        }

        const params = new CompressPDFParams({
            compressionLevel: level as any
        });

        // 4. Create and Submit Job
        const job = new CompressPDFJob({ inputAsset, params });

        console.log(`Submitting Adobe Compression Job (Level: ${compressionLevel})...`);
        const pollingURL = await pdfServices.submit({ job });

        // 5. Poll for Results
        const pdfServicesResponse = await pdfServices.getJobResult({
            pollingURL,
            resultType: CompressPDFResult
        });

        if (!pdfServicesResponse.result) {
            throw new Error("No result returned from Adobe PDF Services");
        }

        const resultAsset = pdfServicesResponse.result.asset;
        const streamAsset = await pdfServices.getContent({ asset: resultAsset });

        // 6. Return Result
        const chunks: Buffer[] = [];
        for await (const chunk of streamAsset.readStream) {
            chunks.push(Buffer.from(chunk));
        }
        const resultBuffer = Buffer.concat(chunks);

        return new NextResponse(resultBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="compressed_${file.name}"`,
            },
        });

    } catch (error: any) {
        console.error('ADOBE API ERROR:', error);

        let errorMessage = 'Compression failed';
        if (error instanceof SDKError || error instanceof ServiceUsageError || error instanceof ServiceApiError) {
            errorMessage = `Adobe Service Error: ${error.message}`;
        } else {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
