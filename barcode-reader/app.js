import { createBarcodeReader } from './scanner.js?copy=close';
import { createDecoder } from './reader.js';

const format = document.body.dataset.format || 'all';
createBarcodeReader({ createReader: () => createDecoder(format) });
