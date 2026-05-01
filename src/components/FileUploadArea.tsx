import React, { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from "@/lib/utils";

interface FileUploadAreaProps {
  onFileUpload?: (file: File) => void;
  onFilesUpload?: (files: File[]) => void;
  multiple?: boolean;
}

export function FileUploadArea({ onFileUpload, onFilesUpload, multiple = false }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length <= 0) return;
    if (multiple) {
      onFilesUpload?.(acceptedFiles);
      return;
    }
    onFileUpload?.(acceptedFiles[0]);
  }, [multiple, onFileUpload, onFilesUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      "image/*": [".jpg", ".jpeg", ".png", ".gif"],
      "application/pdf": [".pdf"]
    },
    multiple,
    maxSize: 10 * 1024 * 1024,
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "cursor-pointer rounded-[14px] border-[1.5px] border-dashed bg-white px-4 py-6 text-center transition group",
        isDragActive
          ? "border-primary ring-4 ring-primary/25"
          : "border-[#DDD4C4] hover:border-[#D2C4AE] hover:bg-[linear-gradient(180deg,#fff,rgba(251,244,228,0.35))]"
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Upload image or PDF"
    >
      <input {...getInputProps()} ref={fileInputRef} aria-hidden="true" />
      <div className="flex flex-col items-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#EED898] bg-[#FBF4E4]">
          <Upload size={18} className="text-[#C08A10]" aria-hidden="true" />
        </div>
        <p className="text-[14px] font-medium text-[#2A2018]">Drop your image here</p>
        <p className="mt-1 text-[12px] text-[#9A8C78]">or click to browse from your files</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <span className="rounded-md border border-[#E4D8C4] bg-[#F5F0E8] px-2 py-1 text-[10px] font-medium tracking-[0.06em] text-[#8A7860]">JPG</span>
          <span className="rounded-md border border-[#E4D8C4] bg-[#F5F0E8] px-2 py-1 text-[10px] font-medium tracking-[0.06em] text-[#8A7860]">PNG</span>
          <span className="rounded-md border border-[#E4D8C4] bg-[#F5F0E8] px-2 py-1 text-[10px] font-medium tracking-[0.06em] text-[#8A7860]">PDF</span>
          <span className="rounded-md border border-[#E4D8C4] bg-[#F5F0E8] px-2 py-1 text-[10px] font-medium tracking-[0.06em] text-[#8A7860]">WEBP</span>
        </div>
      </div>
    </div>
  );
}
