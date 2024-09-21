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
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200",
        isDragActive
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Upload image or PDF"
    >
      <input {...getInputProps()} ref={fileInputRef} aria-hidden="true" />
      <div className="flex flex-col items-center">
        <Upload size={48} className="text-gray-400 dark:text-gray-500" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold text-black dark:text-white">Upload Picture, PDF or Drag & Drop</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">JPG, PNG, GIF up to 10MB</p>
      </div>
    </div>
  );
}