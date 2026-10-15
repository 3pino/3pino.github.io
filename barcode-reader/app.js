import { createBarcodeReader } from './scanner.js';

createBarcodeReader({
  createReader: async () => {
    await import('./vendor/zxing-browser-0.1.5.min.js');
    return new globalThis.ZXingBrowser.BrowserMultiFormatReader(undefined, {
      delayBetweenScanAttempts: 150,
      delayBetweenScanSuccess: 500,
      tryPlayVideoTimeout: 10000,
    });
  },
});
