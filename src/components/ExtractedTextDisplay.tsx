import React, { useEffect, useState } from "react";

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
    <div className="rounded-xl border border-[#EAE3D8] bg-white p-3 transition focus-within:ring-4 focus-within:ring-primary/25">
      <textarea
        className="min-h-[220px] w-full resize-none bg-transparent font-mono text-[12px] leading-6 text-[#6A5C48] placeholder:text-[#C0B098] focus:outline-none md:min-h-[230px]"
        placeholder="Extracted text will appear here after processing your image…"
        value={editableText}
        onChange={handleTextChange}
        aria-label="Editable extracted text"
      />
    </div>
  );
}
