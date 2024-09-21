import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Download, Wand2 } from 'lucide-react';

interface ActionButtonsProps {
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onExtract: () => void;
  // Remove the onSave property
}

export function ActionButtons({ onClear, onCopy, onDownload, onExtract }: ActionButtonsProps) {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 flex items-center justify-between">
      <Button
        variant="outline"
        onClick={onClear}
        className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors duration-200"
        aria-label="Clear all content"
      >
        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Clear
      </Button>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onCopy}
          className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors duration-200"
          aria-label="Copy extracted text"
        >
          <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
          Copy
        </Button>
        <Button
          variant="outline"
          onClick={onDownload}
          className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors duration-200"
          aria-label="Download extracted text"
        >
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Download
        </Button>
        <Button
          variant="default"
          className="bg-gray-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors duration-200"
          onClick={onExtract}
          aria-label="Extract text from image"
        >
          <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Extract Text
        </Button>
      </div>
    </div>
  );
}