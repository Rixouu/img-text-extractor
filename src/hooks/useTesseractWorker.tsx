import { useState, useEffect } from 'react';
import { createWorker, Worker } from 'tesseract.js';

export function useTesseractWorker() {
  const [workerInstance, setWorkerInstance] = useState<Worker | null>(null);

  useEffect(() => {
    async function initWorker() {
      const worker = await createWorker();
      setWorkerInstance(worker);
    }

    initWorker();

    return () => {
      if (workerInstance) {
        workerInstance.terminate();
      }
    };
  }, []);

  return workerInstance;
}