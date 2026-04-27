import React, { useState, useEffect } from 'react';

interface ExtractedTextDisplayProps {
  extractedText: string;
  onTextChange: (text: string) => void;
}

export default function ExtractedTextDisplay({ extractedText, onTextChange }: ExtractedTextDisplayProps) {
  const [editableText, setEditableText] = useState(extractedText);

  useEffect(() => {
    setEditableText(extractedText);
  }, [extractedText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableText(e.target.value);
    onTextChange(e.target.value);
  };

  return (
    <div className="bg-muted/30 border border-border p-4 md:p-6 rounded-2xl mb-6 transition-all duration-300 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
      <textarea
        className="bg-transparent w-full h-64 md:h-80 resize-none focus:outline-none text-foreground font-medium text-lg placeholder:text-muted-foreground/50"
        placeholder="Extracted text will appear here..."
        value={editableText}
        onChange={handleTextChange}
        aria-label="Editable extracted text"
      />
    </div>
  );
}