import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Download, Wand2 } from 'lucide-react';

interface ActionButtonsProps {
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onExtract: () => void;
}

export function ActionButtons({ onClear, onCopy, onDownload, onExtract }: ActionButtonsProps) {
  return (
    <div className="bg-muted/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <Button
        variant="ghost"
        onClick={onClear}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300"
        aria-label="Clear all content"
      >
        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Clear everything
      </Button>
      <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
        <Button
          variant="secondary"
          onClick={onCopy}
          className="rounded-xl font-medium px-6 py-5 h-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Copy extracted text"
        >
          <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
          Copy text
        </Button>
        <Button
          variant="secondary"
          onClick={onDownload}
          className="rounded-xl font-medium px-6 py-5 h-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Download extracted text"
        >
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Download .txt
        </Button>
        <Button
          variant="default"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold px-8 py-5 h-auto transition-all duration-300 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/50"
          onClick={onExtract}
          aria-label="Extract text from image"
        >
          <Wand2 className="mr-2 h-5 w-5" aria-hidden="true" />
          Extract Text Now
        </Button>
      </div>
    </div>
  );
}