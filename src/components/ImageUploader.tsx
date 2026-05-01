"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  ChevronDown,
  Clock,
  Copy,
  Download,
  FileText,
  Layers,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { FileUploadArea } from "./FileUploadArea";
import { useTesseractWorker } from "@/hooks/useTesseractWorker";
import { useProgressSimulation } from "@/hooks/useProgressSimulation";
import { resizeImage } from "@/utils/imageProcessing";
import { cn } from "@/lib/utils";

const ExtractedTextDisplay = dynamic(() => import("./ExtractedTextDisplay"), {
  loading: () => <p>Loading text display...</p>,
});

interface TesseractError extends Error {
  message: string;
}

type HistoryItem = {
  id: string;
  createdAt: number;
  fileName: string;
  languageCode: string;
  languageLabel: string;
  script: string | null;
  text: string;
};

const HISTORY_STORAGE_KEY = "img-extractor-history-v1";

const LANGUAGE_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "eng", label: "English" },
  { code: "spa", label: "Spanish" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
  { code: "ita", label: "Italian" },
  { code: "por", label: "Portuguese" },
  { code: "nld", label: "Dutch" },
  { code: "tur", label: "Turkish" },
  { code: "pol", label: "Polish" },
  { code: "rus", label: "Russian" },
  { code: "ukr", label: "Ukrainian" },
  { code: "ara", label: "Arabic" },
  { code: "hin", label: "Hindi" },
  { code: "jpn", label: "Japanese" },
  { code: "kor", label: "Korean" },
  { code: "chi_sim", label: "Chinese (Simplified)" },
];

function getLanguageLabel(code: string) {
  return LANGUAGE_OPTIONS.find((l) => l.code === code)?.label ?? code;
}

function pickLanguageFromScript(script: string | null, preferredLatinLanguageCode: string) {
  if (!script) return preferredLatinLanguageCode;
  const normalized = script.toLowerCase();
  if (normalized.includes("cyril")) return "rus";
  if (normalized.includes("arab")) return "ara";
  if (normalized.includes("devan")) return "hin";
  if (normalized.includes("hangul")) return "kor";
  if (normalized.includes("han")) return "chi_sim";
  if (normalized.includes("japan")) return "jpn";
  return preferredLatinLanguageCode;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function renderPdfFirstPageToPngFile(pdfFile: File) {
  const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const data = await pdfFile.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PDF render failed");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PDF render failed"))), "image/png");
  });

  page.cleanup();
  pdf.cleanup();
  loadingTask.destroy();

  const baseName = pdfFile.name.replace(/\.pdf$/i, "");
  return new File([blob], `${baseName}-page-1.png`, { type: "image/png" });
}

export function ImageUploader() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const worker = useTesseractWorker();
  const progress: number = useProgressSimulation(isLoading);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [preserveFormatting, setPreserveFormatting] = useState(false);
  const [ocrLanguageCode, setOcrLanguageCode] = useState<string>("eng");
  const [mobileOption, setMobileOption] = useState<
    "auto" | "formatting" | "full" | "batch"
  >("auto");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState<
    "extract" | "files" | "history" | "settings"
  >("extract");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [lastScript, setLastScript] = useState<string | null>(null);
  const [lastLanguageCode, setLastLanguageCode] = useState<string>("eng");
  const [lastLanguageMode, setLastLanguageMode] = useState<
    "Auto" | "Manual" | "History"
  >("Manual");

  const activeFile = batchMode ? batchFiles[batchIndex] ?? null : file;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const filesAnchorRef = useRef<HTMLDivElement | null>(null);
  const outputAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as HistoryItem[];
      if (!Array.isArray(parsed)) return;
      setHistoryItems(parsed);
    } catch {}
  }, []);

  const persistHistory = (next: HistoryItem[]) => {
    setHistoryItems(next);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const addHistoryItem = (item: HistoryItem) => {
    const next = [item, ...historyItems].slice(0, 25);
    persistHistory(next);
  };

  const clearHistory = () => persistHistory([]);

  const handleSingleUpload = async (selectedFile: File) => {
    try {
      const normalizedFile = isPdfFile(selectedFile)
        ? await renderPdfFirstPageToPngFile(selectedFile)
        : selectedFile;

      const resizedImage = await resizeImage(
        normalizedFile,
        isPdfFile(selectedFile) ? 2000 : 1000,
        isPdfFile(selectedFile) ? 2000 : 1000
      );
      const resizedFile = new File([resizedImage], normalizedFile.name, { type: normalizedFile.type });
      setFile(resizedFile);
      setBatchFiles([]);
      setBatchIndex(0);
      setBatchMode(false);

      if (isPdfFile(selectedFile)) {
        showToast("PDF imported", "Using page 1 for OCR");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      const description =
        error instanceof Error
          ? error.message
          : "Failed to process the file. Please try again.";
      toast({
        title: "File Processing Error",
        description,
        variant: "destructive",
      });
    }
  };

  const handleBatchUpload = async (selectedFiles: File[]) => {
    try {
      const convertedFiles: File[] = [];
      for (const f of selectedFiles) {
        if (isPdfFile(f)) {
          convertedFiles.push(await renderPdfFirstPageToPngFile(f));
        } else {
          convertedFiles.push(f);
        }
      }

      const resizedFiles: File[] = [];
      for (const f of convertedFiles) {
        const resized = await resizeImage(f, 2000, 2000);
        resizedFiles.push(new File([resized], f.name, { type: f.type }));
      }

      setBatchFiles((prev) => {
        const next = [...prev, ...resizedFiles];
        return next.slice(0, 20);
      });
      setBatchIndex(0);
      setFile(null);
      setBatchMode(true);
    } catch (error) {
      console.error("Error processing files:", error);
      const description =
        error instanceof Error
          ? error.message
          : "Failed to process one or more files. Please try again.";
      toast({
        title: "File Processing Error",
        description,
        variant: "destructive",
      });
    }
  };

  const fileMeta = useMemo(() => {
    if (!activeFile) return null;
    const ext = (activeFile.name.split(".").pop() || "").toUpperCase();
    const sizeMb = activeFile.size / 1024 / 1024;
    return {
      name: activeFile.name,
      ext: ext || "FILE",
      sizeLabel: `${sizeMb.toFixed(1)} MB`,
    };
  }, [activeFile]);

  const previewUrl = useMemo(() => {
    if (!activeFile) return null;
    if (isPdfFile(activeFile)) return null;
    return URL.createObjectURL(activeFile);
  }, [activeFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const stats = useMemo(() => {
    const text = extractedText || "";
    const characters = text.length;
    const words = text.trim().length ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const lines = text.length ? text.split(/\r?\n/).length : 0;
    return { characters, words, lines };
  }, [extractedText]);

  const handleClear = () => {
    setFile(null);
    setBatchFiles([]);
    setBatchIndex(0);
    setExtractedText("");
    showToast("Cleared", "All content has been cleared");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    showToast("Copied!", "Text copied to clipboard");
  };

  const handleDownload = () => {
    if (!extractedText) {
      showToast("No text to download", "Please extract text from an image first", "destructive");
      return;
    }
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted_text.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded", "Text file has been downloaded");
  };

  const detectScript = async (input: File): Promise<string | null> => {
    if (!worker) return null;
    try {
      const { data } = await worker.detect(input);
      return data?.script ?? null;
    } catch {
      return null;
    }
  };

  const extractTextFromImage = async (input: File, languageCode: string): Promise<string> => {
    if (!worker) throw new Error("Worker not initialized");
    await worker.loadLanguage(languageCode);
    await worker.initialize(languageCode);
    const { data: { text } } = await worker.recognize(input);
    return text;
  };

  const postProcessText = (raw: string) => {
    if (preserveFormatting) return raw;
    return raw.replace(/\s+/g, " ").trim();
  };

  const runSingleExtraction = async (input: File) => {
    if (isPdfFile(input)) {
      input = await renderPdfFirstPageToPngFile(input);
    }
    const script = autoDetectLanguage ? await detectScript(input) : null;
    const effectiveLanguageCode = autoDetectLanguage
      ? pickLanguageFromScript(script, ocrLanguageCode)
      : ocrLanguageCode;
    const mode: "Auto" | "Manual" = autoDetectLanguage ? "Auto" : "Manual";
    const rawText = await extractTextFromImage(input, effectiveLanguageCode);
    const finalText = postProcessText(rawText);

    setLastScript(script);
    setLastLanguageCode(effectiveLanguageCode);
    setLastLanguageMode(mode);

    const historyItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: Date.now(),
      fileName: input.name,
      languageCode: effectiveLanguageCode,
      languageLabel: getLanguageLabel(effectiveLanguageCode),
      script,
      text: finalText,
    };

    addHistoryItem(historyItem);
    return finalText;
  };

  const handleExtractText = async () => {
    if (!worker) {
      showToast(
        "Initialization Error",
        "Text recognition system is not ready. Please try again in a moment.",
        "destructive"
      );
      return;
    }

    if (batchMode) {
      if (batchFiles.length === 0) {
        showToast("No files selected", "Add files in batch mode first", "destructive");
        return;
      }
      setIsLoading(true);
      try {
        for (let i = 0; i < batchFiles.length; i += 1) {
          setBatchIndex(i);
          const text = await runSingleExtraction(batchFiles[i]);
          setExtractedText(text);
        }
        showToast("Batch complete", "All files have been processed");
      } catch (error) {
        console.error("Error extracting text:", error);
        toast({
          title: "Extraction Failed",
          description: "An unexpected error occurred while extracting text",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!file) {
      showToast("No image selected", "Please upload an image first", "destructive");
      return;
    }

    setIsLoading(true);
    try {
      const text = await runSingleExtraction(file);
      setExtractedText(text);
      showToast("Text Extracted", "The text has been successfully extracted from the image");
    } catch (error) {
      console.error("Error extracting text:", error);
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

  const handleTextChange = (newText: string) => {
    setExtractedText(newText);
  };

  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
    });
  };

  return (
    <>
    <section
      className="flex w-full max-w-[1040px] flex-col overflow-hidden rounded-[18px] border border-[#E4DDD4] bg-[#FDFAF6] shadow-[0_18px_55px_rgba(28,20,16,0.10),0_2px_0_rgba(28,20,16,0.04)] md:max-h-none max-h-[calc(100vh-56px)]"
      role="region"
      aria-label="Image Text Extractor"
    >
      <div className="flex flex-col gap-2 border-b border-[#EAE3D8] px-5 py-3 md:flex-row md:items-center md:justify-between md:gap-3 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary">
            <Layers className="h-4 w-4 text-foreground" aria-hidden="true" />
          </div>
          <span className="text-[13px] font-semibold tracking-[-0.2px] text-[#1C1410] truncate">
            Image Text Extractor
          </span>
          <span className="rounded-full border border-[#EDD898] bg-[#FEF3D0] px-2 py-[2px] text-[10px] font-medium tracking-[0.05em] text-[#9A7000]">
            OCR PRO
          </span>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#DDD6CA] bg-white/90 px-3 py-1.5 text-[11px] text-[#6A5C48] transition hover:border-[#D2C8BA] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          >
            <Clock className="h-4 w-4 text-[#9A8C78]" aria-hidden="true" />
            <span>History</span>
          </button>
          <button
            type="button"
            onClick={() => setBatchMode((v) => !v)}
            className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#DDD6CA] bg-white/90 px-3 py-1.5 text-[11px] text-[#6A5C48] transition hover:border-[#D2C8BA] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          >
            <Upload className="h-4 w-4 text-[#9A8C78]" aria-hidden="true" />
            <span>{batchMode ? "Batch: On" : "Batch mode"}</span>
          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="grid flex-1 overflow-y-auto overflow-x-hidden md:grid-cols-2 md:overflow-visible">
        <div className={cn("flex flex-col gap-4 border-b border-[#EAE3D8] p-5 md:border-b-0 md:border-r md:p-6", (mobileNav === "history" || mobileNav === "settings") && "hidden md:flex")}>
          <div ref={filesAnchorRef}>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#B09878]">
              Source
            </div>
            <div className="text-[15px] font-medium tracking-[-0.2px] text-[#1C1410]">
              Upload your image
            </div>
            <div className="mt-1 text-[12px] leading-6 text-[#9A8C78]">
              Drop any image or PDF and extract all readable text instantly.
            </div>
          </div>

          <FileUploadArea
            multiple={batchMode}
            onFileUpload={handleSingleUpload}
            onFilesUpload={handleBatchUpload}
          />

          {activeFile && fileMeta && (
            <div className="flex items-center gap-3 rounded-xl border border-[#EAE3D8] bg-white px-3 py-2">
              <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-lg border border-[#E4D8C4] bg-[#F5F0E8]">
                {previewUrl ? (
                  <div className="relative h-10 w-10">
                    <Image
                      src={previewUrl}
                      alt={fileMeta.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="text-[10px] font-medium tracking-[0.08em] text-[#8A7860]">
                    PDF
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-[#2A2018]">
                  {fileMeta.name}
                </div>
                <div className="text-[11px] text-[#9A8C78]">
                  {fileMeta.sizeLabel} · {fileMeta.ext}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (batchMode) {
                    setBatchFiles((prev) => prev.filter((_, idx) => idx !== batchIndex));
                    setBatchIndex((prev) => Math.max(0, prev - 1));
                    return;
                  }
                  setFile(null);
                }}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-[#E4D8C4] bg-[#F5F0E8] text-[#9A8C78] transition hover:bg-white hover:text-[#6A5C48] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {batchMode && batchFiles.length > 0 && (
            <div className="rounded-xl border border-[#EAE3D8] bg-white p-2">
              <div className="flex items-center justify-between px-1 pb-2">
                <div className="text-[12px] font-medium text-[#2A2018]">
                  Batch queue ({batchFiles.length})
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBatchFiles([]);
                    setBatchIndex(0);
                  }}
                  className="rounded-lg border border-[#DDD6CA] bg-white px-2 py-1 text-[11px] text-[#6A5C48] transition hover:border-[#D2C8BA] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-[160px] space-y-1 overflow-auto pr-1">
                {batchFiles.map((f, idx) => (
                  <button
                    key={`${f.name}-${idx}`}
                    type="button"
                    onClick={() => setBatchIndex(idx)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left text-[12px] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                      idx === batchIndex
                        ? "border-[#EDD898] bg-[#FEF3D0] text-[#6A5C48]"
                        : "border-[#EAE3D8] bg-white text-[#9A8C78]"
                    )}
                  >
                    <span className="truncate">{f.name}</span>
                    <span className="text-[11px]">{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="hidden overflow-hidden rounded-xl border border-[#EAE3D8] bg-white md:block">
            <div className="flex items-center justify-between border-b border-[#F5F0E8] px-3 py-2.5">
              <div>
                <div className="text-[12px] font-medium text-[#2A2018]">Auto-detect language</div>
                <div className="text-[11px] text-[#9A8C78]">Detects script and chooses an OCR language (best effort)</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#9A8C78]">
                  {autoDetectLanguage ? "On" : "Off"}
                </span>
                <button
                  type="button"
                  onClick={() => setAutoDetectLanguage((v) => !v)}
                  aria-label="Auto-detect language"
                  className={cn(
                    "relative h-[18px] w-8 rounded-full border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                    autoDetectLanguage ? "border-primary bg-primary" : "border-[#DCD3C7] bg-[#E4DDD4]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[3px] left-[3px] h-[11px] w-[11px] rounded-full bg-white transition-transform",
                      autoDetectLanguage && "translate-x-[13px]"
                    )}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-[#F5F0E8] px-3 py-2.5">
              <div>
                <div className="text-[12px] font-medium text-[#2A2018]">Preserve formatting</div>
                <div className="text-[11px] text-[#9A8C78]">Keeps line breaks and spacing</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#9A8C78]">
                  {preserveFormatting ? "On" : "Off"}
                </span>
                <button
                  type="button"
                  onClick={() => setPreserveFormatting((v) => !v)}
                  aria-label="Preserve formatting"
                  className={cn(
                    "relative h-[18px] w-8 rounded-full border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                    preserveFormatting ? "border-primary bg-primary" : "border-[#DCD3C7] bg-[#E4DDD4]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[3px] left-[3px] h-[11px] w-[11px] rounded-full bg-white transition-transform",
                      preserveFormatting && "translate-x-[13px]"
                    )}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <div>
                <div className="text-[12px] font-medium text-[#2A2018]">Output language</div>
                <div className="text-[11px] text-[#9A8C78]">
                  {autoDetectLanguage
                    ? "Turn off auto-detect to force a specific language"
                    : "Used for OCR recognition"}
                </div>
              </div>
              <div className="relative">
                <select
                  value={ocrLanguageCode}
                  onChange={(e) => setOcrLanguageCode(e.target.value)}
                  disabled={autoDetectLanguage}
                  className="appearance-none rounded-lg border border-[#E0D8CA] bg-[#F5F0E8] px-2.5 py-1.5 pr-8 text-[11px] text-[#6A5C48] transition hover:border-[#D2C8BA] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Output language"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A8C78]"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => {
                  setMobileOption("auto");
                  setAutoDetectLanguage(true);
                }}
                className={cn(
                  "flex flex-none items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                  mobileOption === "auto"
                    ? "border-[#EDD898] bg-[#FEF3D0] text-[#8A6800]"
                    : "border-[#E4DDD4] bg-white text-[#9A8C78]"
                )}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Auto-lang
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOption("formatting");
                  setPreserveFormatting((v) => !v);
                }}
                className={cn(
                  "flex flex-none items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                  mobileOption === "formatting"
                    ? "border-[#EDD898] bg-[#FEF3D0] text-[#8A6800]"
                    : "border-[#E4DDD4] bg-white text-[#9A8C78]"
                )}
              >
                Preserve
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOption("full");
                  showToast("Full page", "Full page mode is not available yet");
                }}
                className={cn(
                  "flex flex-none items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                  mobileOption === "full"
                    ? "border-[#EDD898] bg-[#FEF3D0] text-[#8A6800]"
                    : "border-[#E4DDD4] bg-white text-[#9A8C78]"
                )}
              >
                Full page
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOption("batch");
                  setBatchMode(true);
                }}
                className={cn(
                  "flex flex-none items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                  mobileOption === "batch"
                    ? "border-[#EDD898] bg-[#FEF3D0] text-[#8A6800]"
                    : "border-[#E4DDD4] bg-white text-[#9A8C78]"
                )}
              >
                Batch
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExtractText}
            disabled={isLoading}
            className={cn(
              "mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-black/5 bg-primary px-4 py-3 text-[13px] font-medium text-[#1C1410] transition hover:shadow-[0_12px_26px_rgba(255,202,29,0.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60",
              isLoading && "animate-pulse"
            )}
            aria-label="Extract text now"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {batchMode ? "Extract batch" : "Extract text now"}
          </button>
        </div>

        <div ref={outputAnchorRef} className={cn("flex flex-col gap-4 p-5 md:p-6", mobileNav !== "extract" && "hidden md:flex")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#B09878]">
                Output
              </div>
              <div className="text-[15px] font-medium tracking-[-0.2px] text-[#1C1410]">
                Extracted text
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!extractedText}
                className="flex items-center gap-2 rounded-lg border border-[#DDD6CA] bg-white px-3 py-1.5 text-[11px] text-[#6A5C48] transition hover:border-[#D2C8BA] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:opacity-50"
              >
                <Copy className="h-4 w-4 text-[#9A8C78]" aria-hidden="true" />
                Copy
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!extractedText}
                className="flex items-center gap-2 rounded-lg border border-[#DDD6CA] bg-white px-3 py-1.5 text-[11px] text-[#6A5C48] transition hover:border-[#D2C8BA] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:opacity-50"
              >
                <Download className="h-4 w-4 text-[#9A8C78]" aria-hidden="true" />
                Save
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-2 rounded-lg border border-[#F0C8B0] bg-white px-3 py-1.5 text-[11px] text-[#A84020] transition hover:bg-[#FFF0EC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                aria-label="Clear"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1">
            <Suspense fallback={<div className="text-sm text-[#9A8C78]">Loading…</div>}>
              <ExtractedTextDisplay extractedText={extractedText} onTextChange={handleTextChange} />
            </Suspense>

            {isLoading && (
              <div className="mt-4 space-y-2" role="status" aria-live="polite">
                <div className="flex items-center justify-between text-[12px] font-medium text-[#6A5C48]">
                  <span>Extracting text...</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAE3D8]">
                  <div
                    role="progressbar"
                    className="h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                    aria-label="Upload progress"
                  />
                </div>
                <p className="text-center text-[11px] text-[#9A8C78]">
                  This may take a moment depending on the image size and complexity
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-[#EAE3D8] bg-white px-3 py-2 text-center">
              <div className="font-mono text-[14px] font-medium text-[#1C1410]">
                {stats.characters || "—"}
              </div>
              <div className="mt-1 text-[10px] text-[#9A8C78]">Characters</div>
            </div>
            <div className="rounded-xl border border-[#EAE3D8] bg-white px-3 py-2 text-center">
              <div className="font-mono text-[14px] font-medium text-[#1C1410]">
                {stats.words || "—"}
              </div>
              <div className="mt-1 text-[10px] text-[#9A8C78]">Words</div>
            </div>
            <div className="rounded-xl border border-[#EAE3D8] bg-white px-3 py-2 text-center">
              <div className="font-mono text-[14px] font-medium text-[#1C1410]">
                {stats.lines || "—"}
              </div>
              <div className="mt-1 text-[10px] text-[#9A8C78]">Lines</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[#EAE3D8] bg-white px-3 py-2.5">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[#EED898] bg-[#FBF4E4]">
              <Upload className="h-4 w-4 text-[#C08A10]" aria-hidden="true" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-[#2A2018]">Language used</div>
              <div className="mt-0.5 text-[11px] text-[#9A8C78]">
                {lastLanguageMode}
                {lastScript ? ` · Script: ${lastScript}` : ""}
              </div>
              <div className="mt-1 h-[3px] w-[60px] overflow-hidden rounded bg-[#EAE3D8]">
                <div className="h-full w-[100%] rounded bg-primary" />
              </div>
            </div>
            <div className="ml-auto font-mono text-[12px] font-medium text-[#C08A10]">
              {getLanguageLabel(lastLanguageCode)}
            </div>
          </div>
        </div>

        <div className={cn("md:hidden p-5 overflow-x-hidden", mobileNav === "history" ? "block" : "hidden")}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-[14px] font-medium text-[#1C1410]">History</div>
            <button
              type="button"
              onClick={clearHistory}
              className="flex-none rounded-full border border-[#DDD6CA] bg-white px-3 py-1.5 text-[11px] text-[#6A5C48] transition hover:border-[#D2C8BA] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            >
              Clear
            </button>
          </div>

          <div className="mt-3 space-y-2 overflow-x-hidden">
            {historyItems.length === 0 ? (
              <div className="rounded-xl border border-[#EAE3D8] bg-white p-4 text-center text-[12px] text-[#9A8C78]">
                No history yet.
              </div>
            ) : (
              historyItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setExtractedText(item.text);
                    setLastLanguageCode(item.languageCode);
                    setLastScript(item.script);
                    setLastLanguageMode("History");
                    setMobileNav("extract");
                    setTimeout(() => outputAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                  }}
                  className="w-full overflow-hidden rounded-xl border border-[#EAE3D8] bg-white p-3 text-left transition hover:border-[#DED4C6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[#EED898] bg-[#FBF4E4]">
                      <FileText className="h-4 w-4 text-[#C08A10]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-[#2A2018]">
                        {item.fileName}
                      </div>
                      <div className="mt-1 truncate text-[11px] text-[#9A8C78]">
                        {new Date(item.createdAt).toLocaleString()} · {item.languageLabel}
                      </div>
                    </div>
                    <div className="flex-none">
                      <div className="rounded-full border border-[#E4DDD4] bg-[#F5F0E8] px-2 py-1 text-[10px] font-medium text-[#6A5C48]">
                        {item.text.length} chars
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={cn("md:hidden p-5", mobileNav === "settings" ? "block" : "hidden")}>
          <div className="text-[14px] font-medium text-[#1C1410]">Settings</div>
          <div className="mt-3 overflow-hidden rounded-xl border border-[#EAE3D8] bg-white">
            <div className="flex items-center justify-between border-b border-[#F5F0E8] px-3 py-2.5">
              <div>
                <div className="text-[12px] font-medium text-[#2A2018]">Auto-detect language</div>
                <div className="text-[11px] text-[#9A8C78]">Detects script and chooses an OCR language</div>
              </div>
              <button
                type="button"
                onClick={() => setAutoDetectLanguage((v) => !v)}
                className={cn(
                  "relative h-[18px] w-8 rounded-full border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                  autoDetectLanguage ? "border-primary bg-primary" : "border-[#DCD3C7] bg-[#E4DDD4]"
                )}
                aria-label="Auto-detect language"
              >
                <span
                  className={cn(
                    "absolute top-[3px] left-[3px] h-[11px] w-[11px] rounded-full bg-white transition-transform",
                    autoDetectLanguage && "translate-x-[13px]"
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-[#F5F0E8] px-3 py-2.5">
              <div>
                <div className="text-[12px] font-medium text-[#2A2018]">Preserve formatting</div>
                <div className="text-[11px] text-[#9A8C78]">Keeps line breaks and spacing</div>
              </div>
              <button
                type="button"
                onClick={() => setPreserveFormatting((v) => !v)}
                className={cn(
                  "relative h-[18px] w-8 rounded-full border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                  preserveFormatting ? "border-primary bg-primary" : "border-[#DCD3C7] bg-[#E4DDD4]"
                )}
                aria-label="Preserve formatting"
              >
                <span
                  className={cn(
                    "absolute top-[3px] left-[3px] h-[11px] w-[11px] rounded-full bg-white transition-transform",
                    preserveFormatting && "translate-x-[13px]"
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-[#F5F0E8] px-3 py-2.5">
              <div>
                <div className="text-[12px] font-medium text-[#2A2018]">OCR language</div>
                <div className="text-[11px] text-[#9A8C78]">
                  {autoDetectLanguage ? "Turn off auto-detect to choose" : "Used for recognition"}
                </div>
              </div>
              <div className="relative">
                <select
                  value={ocrLanguageCode}
                  onChange={(e) => setOcrLanguageCode(e.target.value)}
                  disabled={autoDetectLanguage}
                  className="appearance-none rounded-lg border border-[#E0D8CA] bg-[#F5F0E8] px-2.5 py-1.5 pr-8 text-[11px] text-[#6A5C48] disabled:opacity-60"
                  aria-label="OCR language"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A8C78]" aria-hidden="true" />
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2.5">
              <div>
                <div className="text-[12px] font-medium text-[#2A2018]">Batch mode</div>
                <div className="text-[11px] text-[#9A8C78]">Upload and process multiple files</div>
              </div>
              <button
                type="button"
                onClick={() => setBatchMode((v) => !v)}
                className={cn(
                  "relative h-[18px] w-8 rounded-full border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                  batchMode ? "border-primary bg-primary" : "border-[#DCD3C7] bg-[#E4DDD4]"
                )}
                aria-label="Batch mode"
              >
                <span
                  className={cn(
                    "absolute top-[3px] left-[3px] h-[11px] w-[11px] rounded-full bg-white transition-transform",
                    batchMode && "translate-x-[13px]"
                  )}
                />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={clearHistory}
            className="mt-3 w-full rounded-xl border border-[#DDD6CA] bg-white px-3 py-2.5 text-[12px] font-medium text-[#6A5C48] transition hover:border-[#D2C8BA] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          >
            Clear history
          </button>
        </div>
      </div>

      <nav className="md:hidden border-t border-[#EAE3D8] bg-[#FDFAF6] px-2 py-2">
        <div className="grid grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setMobileNav("extract");
              scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25", mobileNav === "extract" ? "text-[#9A7000]" : "text-[#C0B098]")}
            aria-label="Extract"
          >
            <span className={cn("flex h-7 w-10 items-center justify-center rounded-lg", mobileNav === "extract" ? "bg-[#FEF3D0]" : "")}>
              <Layers className={cn("h-4 w-4", mobileNav === "extract" ? "text-[#C08A10]" : "text-[#C0B098]")} aria-hidden="true" />
            </span>
            Extract
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileNav("files");
              filesAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25", mobileNav === "files" ? "text-[#9A7000]" : "text-[#C0B098]")}
            aria-label="Files"
          >
            <span className={cn("flex h-7 w-10 items-center justify-center rounded-lg", mobileNav === "files" ? "bg-[#FEF3D0]" : "")}>
              <FileText className={cn("h-4 w-4", mobileNav === "files" ? "text-[#C08A10]" : "text-[#C0B098]")} aria-hidden="true" />
            </span>
            Files
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileNav("history");
            }}
            className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25", mobileNav === "history" ? "text-[#9A7000]" : "text-[#C0B098]")}
            aria-label="History"
          >
            <span className={cn("flex h-7 w-10 items-center justify-center rounded-lg", mobileNav === "history" ? "bg-[#FEF3D0]" : "")}>
              <Clock className={cn("h-4 w-4", mobileNav === "history" ? "text-[#C08A10]" : "text-[#C0B098]")} aria-hidden="true" />
            </span>
            History
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileNav("settings");
            }}
            className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25", mobileNav === "settings" ? "text-[#9A7000]" : "text-[#C0B098]")}
            aria-label="Settings"
          >
            <span className={cn("flex h-7 w-10 items-center justify-center rounded-lg", mobileNav === "settings" ? "bg-[#FEF3D0]" : "")}>
              <SlidersHorizontal className={cn("h-4 w-4", mobileNav === "settings" ? "text-[#C08A10]" : "text-[#C0B098]")} aria-hidden="true" />
            </span>
            Settings
          </button>
        </div>
      </nav>
    </section>
    {isHistoryOpen && (
      <div className="fixed inset-0 z-50 hidden md:block">
        <button
          type="button"
          className="absolute inset-0 bg-black/30"
          onClick={() => {
            setIsHistoryOpen(false);
          }}
          aria-label="Close history"
        />
        <div className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[#E4DDD4] bg-[#FDFAF6] shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between border-b border-[#EAE3D8] px-4 py-3">
            <div className="text-[13px] font-medium text-[#1C1410]">History</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearHistory}
                className="rounded-lg border border-[#DDD6CA] bg-white px-3 py-1.5 text-[11px] text-[#6A5C48] transition hover:border-[#D2C8BA] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
              >
                Clear history
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHistoryOpen(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDD6CA] bg-white text-[#6A5C48] transition hover:border-[#D2C8BA] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-auto p-3">
            {historyItems.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-[#9A8C78]">
                No history yet.
              </div>
            ) : (
              <div className="space-y-2">
                {historyItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setExtractedText(item.text);
                      setLastLanguageCode(item.languageCode);
                      setLastScript(item.script);
                      setLastLanguageMode("History");
                      setIsHistoryOpen(false);
                    }}
                    className="w-full rounded-xl border border-[#EAE3D8] bg-white p-3 text-left transition hover:border-[#DED4C6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[12px] font-medium text-[#2A2018]">
                          {item.fileName}
                        </div>
                        <div className="mt-1 text-[11px] text-[#9A8C78]">
                          {new Date(item.createdAt).toLocaleString()} · {item.languageLabel}
                          {item.script ? ` · ${item.script}` : ""}
                        </div>
                      </div>
                      <div className="text-[11px] text-[#6A5C48]">
                        {item.text.length} chars
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
