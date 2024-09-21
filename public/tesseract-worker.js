importScripts('./tesseract.min.js');

console.log('Tesseract worker initialized');

self.onmessage = async (event) => {
  console.log('Worker received message:', event.data);
  const { image } = event.data;
  
  try {
    const worker = await Tesseract.createWorker({
      logger: m => {
        console.log('Tesseract progress:', m);
        if ('progress' in m && typeof m.progress === 'number') {
          self.postMessage({ type: 'progress', data: Math.round(m.progress * 100) });
        }
      }
    });

    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    console.log('Starting recognition');
    // Convert ArrayBuffer back to Uint8Array for Tesseract
    const uint8Array = new Uint8Array(image);
    const { data: { text } } = await worker.recognize(uint8Array);
    console.log('Recognition complete');
    
    self.postMessage({ type: 'result', data: text });
    
    await worker.terminate();
  } catch (error) {
    console.error('Error in worker:', error);
    self.postMessage({ type: 'error', data: error.message });
  }
};