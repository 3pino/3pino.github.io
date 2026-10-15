const FORMATS = {
  all: null,
  code128: ['CODE_128'],
  code39: ['CODE_39'],
  'code39-93': ['CODE_39', 'CODE_93'],
  ean: ['EAN_13', 'EAN_8'],
  qr: ['QR_CODE'],
  datamatrix: ['DATA_MATRIX'],
};

export async function createDecoder(format = 'all') {
  if (!Object.prototype.hasOwnProperty.call(FORMATS, format)) throw Error('読み取り形式が不正です');
  await import('./vendor/zxing-browser-0.1.5.min.js');
  const { BrowserMultiFormatReader, BarcodeFormat } = globalThis.ZXingBrowser;
  const reader = new BrowserMultiFormatReader(undefined, {
    delayBetweenScanAttempts: 150,
    delayBetweenScanSuccess: 500,
    tryPlayVideoTimeout: 10000,
  });
  // 結果を後から捨てるのではなく、デコーダー自体の判定対象を限定する。
  if (FORMATS[format]) reader.possibleFormats = FORMATS[format].map((name) => BarcodeFormat[name]);
  return reader;
}
