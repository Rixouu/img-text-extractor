"use client";

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { XCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { FileUploadArea } from './FileUploadArea';
import { ActionButtons } from './ActionButtons';
import { useTesseractWorker } from '@/hooks/useTesseractWorker';
import { useProgressSimulation } from '@/hooks/useProgressSimulation';
import { resizeImage } from '@/utils/imageProcessing';

const ExtractedTextDisplay = dynamic(() => import('./ExtractedTextDisplay'), {
  loading: () => <p>Loading text display...</p>,
});

interface TesseractError extends Error {
  message: string;
}

export function ImageUploader() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const worker = useTesseractWorker();
  const progress: number = useProgressSimulation(isLoading);

  const handleImageUpload = async (selectedFile: File) => {
    try {
      const resizedImage = await resizeImage(selectedFile);
      const resizedFile = new File([resizedImage], selectedFile.name, { type: selectedFile.type });
      setFile(resizedFile);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "File Processing Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setFile(null);
    setExtractedText("");
    showToast("Cleared", "All content has been cleared");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const handleDownload = () => {
    if (!extractedText) {
      toast({
        title: "No text to download",
        description: "Please extract text from an image first",
        variant: "destructive",
      });
      return;
    }
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted_text.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Text file has been downloaded",
      variant: "default",
    });
  };

  const handleExtractText = async () => {
    if (!file) {
      showToast("No image selected", "Please upload an image first", "destructive");
      return;
    }

    if (!worker) {
      toast({
        title: "Initialization Error",
        description: "Text recognition system is not ready. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const text = await extractTextFromImage(file);
      setExtractedText(text);
      toast({
        title: "Text Extracted",
        description: "The text has been successfully extracted from the image",
        variant: "default",
      });
    } catch (error) {
      console.error('Error extracting text:', error);
      let errorMessage = "An unexpected error occurred while extracting text";

      if (error instanceof Error) {
        const tesseractError = error as TesseractError;
        if (tesseractError.message.includes("memory")) {
          errorMessage = "The image is too large to process. Please try a smaller image.";
        } else if (tesseractError.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
      }

      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    if (!worker) throw new Error('Worker not initialized');
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(file);
    return text;
  };

  const handleTextChange = (newText: string) => {
    setExtractedText(newText);
  };

  const renderFilePreview = () => {
    if (!file) return null;

    return (
      <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 relative rounded overflow-hidden">
            <Image
              src={URL.createObjectURL(file)}
              alt="Preview"
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <button
          onClick={() => setFile(null)}
          className="text-gray-400 hover:text-gray-500"
          aria-label="Remove file"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    );
  };

  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      className: variant === "destructive" ? "bg-red-600" : "bg-gray-700",
    });
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-premium border border-border overflow-hidden flex flex-col p-8 md:p-12" role="region" aria-label="Image Text Extractor">
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-primary/20 relative overflow-hidden p-4">
          <Image
            src="/icon-img-extractor.png"
            alt="Icon"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">Image Text Extractor</h1>
        <p className="text-muted-foreground text-lg max-w-md">Extract text from images effortlessly with our premium OCR tool.</p>
      </div>

      <div className="flex-grow space-y-8">
        <FileUploadArea onFileUpload={handleImageUpload} />

        {file && renderFilePreview()}

        <div className="mt-4">
          <Suspense fallback={<div className="text-gray-700 dark:text-gray-300">Loading text display...</div>}>
            <ExtractedTextDisplay extractedText={extractedText} onTextChange={handleTextChange} />
          </Suspense>
          {isLoading && (
            <div className="mt-4 space-y-2" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>Extracting text...</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-full bg-gray-600 dark:bg-gray-400 transition-all duration-300 ease-in-out"
                  style={{ width: `${progress}%` }}
                  aria-label="Upload progress"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                This may take a moment depending on the image size and complexity
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ActionButtons
          onClear={handleClear}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onExtract={handleExtractText}
        />
      </div>
    </div>
  );
}
