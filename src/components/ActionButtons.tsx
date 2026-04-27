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
    <div className="flex flex-col gap-6 w-full">
      <Button
        variant="default"
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-bold px-8 py-8 h-auto transition-all duration-300 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/50 text-xl group"
        onClick={onExtract}
        aria-label="Extract text from image"
      >
        <Wand2 className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
        Extract Text Now
      </Button>

      <div className="bg-muted/30 p-4 rounded-[2rem] flex flex-wrap items-center justify-center gap-3 border border-border/50">
        <Button
          variant="secondary"
          onClick={onCopy}
          className="rounded-xl font-semibold px-6 py-4 h-auto transition-all duration-300 hover:bg-white hover:shadow-sm"
          aria-label="Copy extracted text"
        >
          <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
          Copy
        </Button>
        <Button
          variant="secondary"
          onClick={onDownload}
          className="rounded-xl font-semibold px-6 py-4 h-auto transition-all duration-300 hover:bg-white hover:shadow-sm"
          aria-label="Download extracted text"
        >
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Download
        </Button>
        <div className="w-px h-6 bg-border mx-2 hidden md:block" />
        <Button
          variant="ghost"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 font-medium"
          aria-label="Clear all content"
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Clear
        </Button>
      </div>
    </div>
  );
}