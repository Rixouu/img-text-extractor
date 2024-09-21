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
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-4">
      <textarea
        className="bg-gray-50 dark:bg-gray-800 w-full h-32 resize-none focus:outline-none text-gray-800 dark:text-gray-200 font-medium"
        placeholder="Extracted text will appear here..."
        value={editableText}
        onChange={handleTextChange}
        aria-label="Editable extracted text"
      />
    </div>
  );
}