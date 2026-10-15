import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { isDecodeMiss } from '../scanner.js';
import '../vendor/zxing-browser-0.1.5.min.js';

const { BrowserMultiFormatReader, BarcodeFormat } = globalThis.ZXingBrowser;
const fixtures = JSON.parse(fs.readFileSync(new URL('./fixtures/barcodes.json', import.meta.url), 'utf8'));

// ピクセル配列をCanvas相当の入力にし、配信するZXing本体で復号する。
// カメラ・ブラウザの実機動作を保証するテストではない。
function canvasFrom(fixture) {
  const width = fixture.rows[0].length * fixture.scaleX, height = fixture.rows.length * fixture.scaleY;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const value = fixture.rows[Math.floor(y / fixture.scaleY)][Math.floor(x / fixture.scaleX)] === '1' ? 0 : 255;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }
  return { width, height, getContext: () => ({ getImageData: () => ({ data: pixels }) }) };
}

for (const fixture of fixtures) {
  test('vendored ZXing decodes actual ' + fixture.format + ' pixels', () => {
    const result = new BrowserMultiFormatReader().decodeFromCanvas(canvasFrom(fixture));
    assert.equal(result.getText(), fixture.text);
    assert.equal(BarcodeFormat[result.getBarcodeFormat()], fixture.format);
  });
}

test('a blank frame raises a recognized decode miss in the minified distribution', () => {
  const canvas = canvasFrom({ rows: Array(60).fill('0'.repeat(100)), scaleX: 1, scaleY: 1 });
  assert.throws(() => new BrowserMultiFormatReader().decodeFromCanvas(canvas), isDecodeMiss);
});

test('the vendored bundle is the pinned, unmodified npm distribution', () => {
  const bytes = fs.readFileSync(new URL('../vendor/zxing-browser-0.1.5.min.js', import.meta.url));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
    'b5ad3df920738ca7adcb74508d7e6b6a5b9024993fb9a0c702da1ad8964eca07');
});

test('the page uses only local scripts/styles and blocks data uploads with CSP', () => {
  const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(page, /connect-src 'none'/);
  assert.match(page, /<video[^>]*\bmuted\b[^>]*\bplaysinline\b/);
  assert.match(page, /<textarea[^>]*\breadonly\b/);
  assert.doesNotMatch(page, /<iframe|<form|https?:\/\//);
  for (const match of page.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(match[1].startsWith('./'));
    assert.ok(fs.existsSync(new URL('../' + match[1], import.meta.url)));
  }
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});
