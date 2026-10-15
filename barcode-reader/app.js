import { createBarcodeReader } from './scanner.js?launch=auto';
import { createDecoder } from './reader.js?formats=limited';

const format = document.body.dataset.format || 'all';
void createBarcodeReader({ createReader: () => createDecoder(format) }).start();
