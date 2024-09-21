"use client";

import React from 'react';
import { ImageUploader } from "@/components/ImageUploader";
import { ErrorBoundary } from './ErrorBoundary';

export function ClientPage() {
  return (
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ImageUploader />
    </ErrorBoundary>
  );
}