"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    accept?: Record<string, string[]>;
    multiple?: boolean;
    className?: string;
}

export function FileUpload({
    onFilesSelected,
    accept = { "application/pdf": [".pdf"] },
    multiple = true,
    className,
}: FileUploadProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onFilesSelected(acceptedFiles);
            }
        },
        [onFilesSelected]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        multiple,
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50",
                className
            )}
        >
            <input {...getInputProps()} />
            <div className="bg-slate-800 p-4 rounded-full mb-4">
                <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-slate-200 mb-1">
                {isDragActive ? "Drop files here" : "Click or drag files to upload"}
            </p>
            <p className="text-sm text-slate-500">
                {multiple ? "Upload multiple files" : "Upload a file"}
            </p>
        </div>
    );
}
