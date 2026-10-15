import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { isDecodeMiss } from '../scanner.js';
import { createDecoder } from '../reader.js';
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
  test('unrestricted page decoder reads actual ' + fixture.format + ' pixels', async () => {
    const result = (await createDecoder('all')).decodeFromCanvas(canvasFrom(fixture));
    assert.equal(result.getText(), fixture.text);
    assert.equal(BarcodeFormat[result.getBarcodeFormat()], fixture.format);
  });
}

const restrictedFormats = {
  code128: ['CODE_128'],
  code39: ['CODE_39'],
  'code39-93': ['CODE_39', 'CODE_93'],
  ean: ['EAN_13', 'EAN_8', 'UPC_A'],
  qr: ['QR_CODE'],
  datamatrix: ['DATA_MATRIX'],
};
for (const [mode, accepted] of Object.entries(restrictedFormats)) {
  for (const fixture of fixtures) {
    test(mode + ' decoder ' + (accepted.includes(fixture.format) ? 'accepts ' : 'rejects ') + fixture.format, async () => {
      const reader = await createDecoder(mode);
      if (accepted.includes(fixture.format)) {
        const result = reader.decodeFromCanvas(canvasFrom(fixture));
        // UPC-Aと先頭0のEAN-13は同じバー列。EAN限定時は13桁で返る。
        const upcAsEan = mode === 'ean' && fixture.format === 'UPC_A';
        assert.equal(result.getText(), (upcAsEan ? '0' : '') + fixture.text);
        assert.equal(result.getBarcodeFormat(), BarcodeFormat[upcAsEan ? 'EAN_13' : fixture.format]);
      } else assert.throws(() => reader.decodeFromCanvas(canvasFrom(fixture)), isDecodeMiss);
    });
  }
}

test('an unknown format fails closed instead of falling back to unrestricted detection', async () => {
  for (const mode of ['unknown', 'toString', 'constructor']) {
    await assert.rejects(createDecoder(mode), /読み取り形式が不正/);
  }
});

test('a blank frame raises a recognized decode miss in the minified distribution', () => {
  const canvas = canvasFrom({ rows: Array(60).fill('0'.repeat(100)), scaleX: 1, scaleY: 1 });
  assert.throws(() => new BrowserMultiFormatReader().decodeFromCanvas(canvas), isDecodeMiss);
});

test('the vendored bundle is the pinned, unmodified npm distribution', () => {
  const bytes = fs.readFileSync(new URL('../vendor/zxing-browser-0.1.5.min.js', import.meta.url));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
    'b5ad3df920738ca7adcb74508d7e6b6a5b9024993fb9a0c702da1ad8964eca07');
});

for (const [file, format] of [
  ['index.html', 'all'], ['code128/index.html', 'code128'], ['code39/index.html', 'code39'],
  ['ean/index.html', 'ean'], ['qr/index.html', 'qr'], ['datamatrix/index.html', 'datamatrix'],
  ['code39-93/index.html', 'code39-93'],
]) {
  test(file + ' has one copy-and-close control, the correct mode, and only local resources', () => {
    const url = new URL('../' + file, import.meta.url);
    const page = fs.readFileSync(url, 'utf8');
    assert.match(page, new RegExp('data-format="' + format + '"'));
    assert.match(page, /connect-src 'none'/);
    assert.match(page, /<video[^>]*\bmuted\b[^>]*\bplaysinline\b/);
    assert.match(page, /<textarea[^>]*\breadonly\b/);
    assert.match(page, /id="copyClose"[^>]*>コピーして閉じる<\/button>/);
    assert.doesNotMatch(page, /id="(?:copy|start|stop)"|<nav\b|<h2\b|<iframe|<form|https?:\/\//);
    assert.match(page, /id="retry"[^>]*hidden/);
    const footer = page.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1];
    assert.ok(footer);
    assert.doesNotMatch(footer, /<p\b/);
    assert.doesNotMatch(page, /画像・読み取り結果のサーバー送信や履歴の保存/);
    for (const match of page.matchAll(/(?:src|href)="([^"]+)"/g)) {
      assert.match(match[1], /^\.\.?\//);
      assert.ok(fs.existsSync(new URL(match[1], url)));
    }
    const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length);
  });
}

test('pages share the dark GAS-style tokens and use the configured reader factory', () => {
  const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  for (const declaration of [
    'color-scheme: dark', '--color-bg: #0f1419', '--color-surface: #182029',
    '--color-header-bg: #0b2237', '--color-primary: #26719f', '--radius: 6px',
  ]) assert.ok(css.includes(declaration));
  const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(app, /document\.body\.dataset\.format/);
  assert.match(app, /createDecoder\(format\)/);
  assert.match(app, /createBarcodeReader\([\s\S]*\)\.start\(\)/);
});
