export async function createDecoder(format = 'all') {
  if (!['all', 'code128'].includes(format)) throw Error('読み取り形式が不正です');
  await import('./vendor/zxing-browser-0.1.5.min.js');
  const { BrowserMultiFormatReader, BarcodeFormat } = globalThis.ZXingBrowser;
  const reader = new BrowserMultiFormatReader(undefined, {
    delayBetweenScanAttempts: 150,
    delayBetweenScanSuccess: 500,
    tryPlayVideoTimeout: 10000,
  });
  // 結果を後から捨てるのではなく、デコーダー自体の判定対象を限定する。
  if (format === 'code128') reader.possibleFormats = [BarcodeFormat.CODE_128];
  return reader;
}
