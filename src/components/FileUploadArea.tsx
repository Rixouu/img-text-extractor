import React, { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from "@/lib/utils";

interface FileUploadAreaProps {
  onFileUpload: (file: File) => void;
}

export function FileUploadArea({ onFileUpload }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      "image/*": [".jpg", ".jpeg", ".png", ".gif"],
      "application/pdf": [".pdf"]
    },
    multiple: false,
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
        "border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 group cursor-pointer",
        isDragActive
          ? "border-primary bg-primary/5 scale-[0.99]"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Upload image or PDF"
    >
      <input {...getInputProps()} ref={fileInputRef} aria-hidden="true" />
      <div className="flex flex-col items-center">
        <div className="p-4 bg-muted rounded-full group-hover:bg-primary/10 transition-colors duration-300">
          <Upload size={32} className="text-muted-foreground group-hover:text-primary transition-colors duration-300" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xl font-semibold tracking-tight text-foreground">Drop your image here</p>
        <p className="text-muted-foreground mt-2">or click to browse from your files</p>
        <div className="mt-6 flex gap-2">
          <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full uppercase tracking-wider">JPG</span>
          <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full uppercase tracking-wider">PNG</span>
          <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full uppercase tracking-wider">PDF</span>
        </div>
      </div>
    </div>
  );
}