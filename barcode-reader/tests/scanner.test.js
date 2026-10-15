import test from 'node:test';
import assert from 'node:assert/strict';
import { createBarcodeReader, isDecodeMiss } from '../scanner.js';

const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
class Target {
  listeners = new Map();
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  fire(type) { for (const fn of this.listeners.get(type) || []) fn(); }
}
function fixture(options = {}) {
  const nodes = {};
  const document = new Target();
  document.hidden = false;
  document.getElementById = (id) => nodes[id] ||= Object.assign(new Target(), {
    disabled: false, hidden: false, value: '', textContent: '', srcObject: null,
    pause() {}, focus() { this.focused = true; }, select() { this.selected = true; },
  });
  const window = Object.assign(new Target(), { isSecureContext: options.secure !== false, close() { closed++; } });
  const track = Object.assign(new Target(), { stop() { stopped++; } });
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  const controls = { stop() { controlsStopped++; if (options.stopError) throw Error('cleanup'); } };
  const writes = [];
  let callback, mediaCalls = 0, decodeCalls = 0, stopped = 0, controlsStopped = 0, closed = 0, requested;
  const navigator = {
    mediaDevices: { getUserMedia: async (constraints) => {
      mediaCalls++; requested = constraints;
      options.onMedia?.();
      if (options.mediaError) throw Object.assign(Error('camera'), { name: options.mediaError });
      return options.mediaPromise || stream;
    } },
    clipboard: { writeText: async (text) => {
      writes.push(text);
      if (options.copyError) throw Error('clipboard');
      if (options.copyPromise) await options.copyPromise;
    } },
  };
  if (options.noCamera) delete navigator.mediaDevices;
  if (options.noClipboard) delete navigator.clipboard;
  const reader = { decodeFromStream: async (source, video, fn) => {
    decodeCalls++; callback = fn;
    assert.equal(source, stream);
    video.srcObject = source;
    if (options.decodeError) throw Error('decode');
    if (options.synchronousText) fn({ getText: () => options.synchronousText }, undefined, controls);
    if (options.decodePromise) await options.decodePromise;
    return controls;
  } };
  const app = options.skipController ? null
    : createBarcodeReader({ document, navigator, window, createReader: () => options.readerPromise || reader });
  return {
    app, nodes, document, window, navigator, stream, track, writes, reader,
    emit: (text) => callback({ getText: () => text }, undefined, controls),
    error: (error) => callback(undefined, error, controls),
    counts: () => ({ mediaCalls, decodeCalls, stopped, controlsStopped, closed }),
    constraints: () => requested,
  };
}

test('starting requests the rear camera immediately without start/stop controls or waiting for the decoder', async () => {
  const f = fixture();
  assert.equal(f.nodes.start, undefined);
  assert.equal(f.nodes.stop, undefined);
  assert.equal(f.nodes.retry.hidden, true);
  const pending = f.app.start();
  assert.equal(f.counts().mediaCalls, 1);
  assert.equal(f.constraints().audio, false);
  assert.equal(f.constraints().video.facingMode.ideal, 'environment');
  await pending;
  assert.equal(f.nodes.preview.hidden, false);
  assert.equal(f.nodes.retry.hidden, true);
  f.app.stop();
  assert.equal(f.nodes.video.srcObject, null);
  assert.equal(f.nodes.preview.hidden, true);
  assert.ok(f.counts().stopped > 0);
});

test('rejects insecure contexts and browsers without camera support', async () => {
  for (const options of [{ secure: false }, { noCamera: true }]) {
    const f = fixture(options);
    assert.equal(f.nodes.retry.hidden, true);
    await f.app.start();
    assert.equal(f.counts().mediaCalls, 0);
    assert.match(f.nodes.status.textContent, /HTTPS|このブラウザ/);
  }
});

test('the first result stops the camera, preserves raw text and never interprets it as markup', async () => {
  const f = fixture(); await f.app.start();
  const value = '000123\r\n<script>alert(1)</script>\u001d';
  f.emit(value);
  assert.equal(f.nodes.code.value, value);
  assert.equal(f.nodes.code.innerHTML, undefined);
  assert.equal(f.nodes.result.hidden, false);
  assert.equal(f.nodes.preview.hidden, true);
  assert.equal(f.nodes.video.srcObject, null);
  assert.ok(f.counts().stopped > 0);
  assert.equal(f.nodes.retry.textContent, '読み直す');
  assert.equal(f.nodes.retry.hidden, false);
  assert.equal(f.nodes.copyClose.disabled, false);
  assert.equal(f.nodes.copy, undefined);
  f.emit('later result');
  assert.equal(f.nodes.code.value, value);
  await f.app.copy();
  assert.deepEqual(f.writes, [value]);
  assert.equal(f.counts().closed, 1);
});

test('a result delivered before the decode Promise resolves is accepted and its controls released', async () => {
  const f = fixture({ synchronousText: '000123' });
  await f.app.start();
  assert.equal(f.nodes.code.value, '000123');
  assert.ok(f.counts().stopped > 0);
  assert.ok(f.counts().controlsStopped > 0);
  assert.equal(f.nodes.retry.disabled, false);
  assert.equal(f.nodes.status.textContent, '読み取りました。');
});

test('repeated starts cannot open multiple cameras', async () => {
  const permission = deferred(), f = fixture({ mediaPromise: permission.promise });
  const pending = f.app.start(); await tick();
  await f.app.start();
  assert.equal(f.counts().mediaCalls, 1);
  permission.resolve(f.stream); await pending;
  await f.app.start();
  assert.equal(f.counts().mediaCalls, 1);
  f.app.stop();
});

test('stopping while the decoder loads releases the already acquired camera and never starts decoding', async () => {
  const library = deferred(), f = fixture({ readerPromise: library.promise });
  const pending = f.app.start(); await tick();
  assert.equal(f.counts().mediaCalls, 1);
  f.app.stop();
  library.resolve(f.reader); await pending;
  assert.ok(f.counts().stopped > 0);
  assert.equal(f.counts().decodeCalls, 0);
  assert.equal(f.nodes.retry.disabled, false);
});

test('late camera permission after cancellation releases its stream without starting decoding', async () => {
  const permission = deferred(), f = fixture({ mediaPromise: permission.promise });
  const pending = f.app.start(); await tick();
  f.app.stop();
  await f.app.start();
  assert.equal(f.counts().mediaCalls, 1);
  permission.resolve(f.stream); await pending;
  assert.ok(f.counts().stopped > 0);
  assert.equal(f.counts().decodeCalls, 0);
  assert.equal(f.nodes.retry.disabled, false);
  assert.equal(f.nodes.status.textContent, '読み取りを停止しました。');
});

test('stopping while video initialization is pending rejects late results and releases late controls', async () => {
  const decode = deferred(), f = fixture({ decodePromise: decode.promise });
  const pending = f.app.start(); await tick();
  f.app.stop(); f.emit('stale code');
  assert.equal(f.nodes.code.value, '');
  await f.app.start();
  assert.equal(f.counts().mediaCalls, 1);
  decode.resolve(); await pending;
  assert.ok(f.counts().controlsStopped > 0);
  assert.equal(f.nodes.video.srcObject, null);
  assert.equal(f.nodes.retry.disabled, false);
});

test('decode misses continue scanning, while unexpected errors release the camera', async () => {
  const f = fixture(); await f.app.start();
  for (const kind of ['NotFoundException', 'ChecksumException', 'FormatException']) {
    const error = { getKind: () => kind };
    assert.equal(isDecodeMiss(error), true);
    f.error(error);
    assert.equal(f.nodes.preview.hidden, false);
  }
  f.error(Error('canvas failed'));
  assert.equal(f.nodes.preview.hidden, true);
  assert.ok(f.counts().stopped > 0);
  assert.match(f.nodes.status.textContent, /問題が発生/);
});

test('camera permission, missing devices and busy-camera errors show actionable messages', async () => {
  for (const [name, message] of [
    ['NotAllowedError', /カメラを許可/], ['NotFoundError', /見つかりません/], ['NotReadableError', /他のアプリ/],
  ]) {
    const f = fixture({ mediaError: name }); await f.app.start();
    assert.match(f.nodes.status.textContent, message);
    assert.equal(f.nodes.retry.hidden, false);
    assert.equal(f.nodes.retry.disabled, false);
    assert.equal(f.nodes.preview.hidden, true);
  }
});

test('failed library loading and failed video startup leave no active stream', async () => {
  const library = deferred(); library.reject(Error('library failed'));
  const f = fixture({ readerPromise: library.promise }); await f.app.start();
  assert.equal(f.counts().mediaCalls, 1);
  assert.ok(f.counts().stopped > 0);
  assert.equal(f.nodes.retry.disabled, false);
  const g = fixture({ decodeError: true }); await g.app.start();
  assert.ok(g.counts().stopped > 0);
  assert.equal(g.nodes.video.srcObject, null);
  assert.equal(g.nodes.retry.disabled, false);
});

test('hiding the tab, leaving the page or ending the video track stops the camera', async () => {
  for (const event of ['visibilitychange', 'pagehide', 'ended']) {
    const f = fixture(); await f.app.start();
    if (event === 'visibilitychange') { f.document.hidden = true; f.document.fire(event); }
    if (event === 'pagehide') f.window.fire(event);
    if (event === 'ended') f.track.fire(event);
    assert.ok(f.counts().stopped > 0);
    assert.equal(f.nodes.video.srcObject, null);
    assert.equal(f.nodes.preview.hidden, true);
  }
});

test('clipboard failures select the code for manual copying and never close the tab', async () => {
  for (const options of [{ copyError: true }, { noClipboard: true }]) {
    const f = fixture(options); await f.app.start(); f.emit('00000123');
    assert.equal(await f.app.copy(), false);
    assert.equal(f.counts().closed, 0);
    assert.equal(f.nodes.code.selected, true);
    assert.match(f.nodes.status.textContent, /長押し/);
    assert.equal(f.nodes.copyClose.disabled, false);
  }
});

test('copy-and-close only closes after successful clipboard writing and suppresses duplicate clicks', async () => {
  const write = deferred(), f = fixture({ copyPromise: write.promise });
  await f.app.start(); f.emit('00000123');
  const pending = f.app.copy(); await tick();
  assert.equal(f.counts().closed, 0);
  assert.equal(f.nodes.copyClose.disabled, true);
  assert.equal(f.nodes.retry.disabled, true);
  await f.app.copy();
  assert.deepEqual(f.writes, ['00000123']);
  write.resolve(); assert.equal(await pending, true);
  assert.equal(f.counts().closed, 1);
  assert.match(f.nodes.status.textContent, /このタブを閉じて/);
});

test('a browser blocking window.close does not turn a successful copy into a clipboard failure', async () => {
  const f = fixture(); await f.app.start(); f.emit('00000123');
  f.window.close = () => { throw Error('Closing blocked'); };
  assert.equal(await f.app.copy(), true);
  assert.deepEqual(f.writes, ['00000123']);
  assert.equal(f.nodes.code.selected, undefined);
  assert.match(f.nodes.status.textContent, /このタブを閉じて/);
});

test('the single copy-and-close button writes and then closes, without a separate copy control', async () => {
  const f = fixture(); await f.app.start(); f.emit('00000123');
  assert.equal(f.nodes.copy, undefined);
  f.nodes.copyClose.fire('click'); await tick();
  assert.deepEqual(f.writes, ['00000123']);
  assert.equal(f.counts().closed, 1);
});

test('initially hidden pages wait for visibility before requesting camera permission', async () => {
  const f = fixture();
  f.document.hidden = true;
  await f.app.start();
  assert.equal(f.counts().mediaCalls, 0);
  f.document.hidden = false;
  f.document.fire('visibilitychange'); await tick();
  assert.equal(f.counts().mediaCalls, 1);
  f.app.stop();
});

test('returning after a hidden tab requires retry and does not discard a result automatically', async () => {
  const f = fixture(); await f.app.start();
  f.document.hidden = true; f.document.fire('visibilitychange');
  f.document.hidden = false; f.document.fire('visibilitychange'); await tick();
  assert.equal(f.counts().mediaCalls, 1);
  assert.equal(f.nodes.retry.hidden, false);
  assert.equal(f.nodes.retry.textContent, '再試行');
  f.nodes.retry.fire('click'); await tick();
  assert.equal(f.counts().mediaCalls, 2);
  f.emit('00000123');
  f.document.hidden = true; f.document.fire('visibilitychange');
  f.document.hidden = false; f.document.fire('visibilitychange'); await tick();
  assert.equal(f.counts().mediaCalls, 2);
  assert.equal(f.nodes.code.value, '00000123');
});

test('retry can rescan after a result without reintroducing initial start controls', async () => {
  const f = fixture(); await f.app.start(); f.emit('first');
  f.nodes.retry.fire('click'); await tick();
  assert.equal(f.counts().mediaCalls, 2);
  assert.equal(f.nodes.result.hidden, true);
  assert.equal(f.nodes.retry.hidden, true);
  assert.equal(f.nodes.copyClose.hidden, true);
  f.emit('second');
  assert.equal(f.nodes.code.value, 'second');
});

test('the actual page entry requests camera permission on load for both modes without a click', { timeout: 5000 }, async () => {
  for (const format of ['all', 'code128']) {
    const permission = deferred(), requested = deferred();
    const f = fixture({ skipController: true, mediaPromise: permission.promise, onMedia: () => requested.resolve() });
    f.document.body = { dataset: { format } };
    const saved = new Map();
    for (const key of ['document', 'navigator', 'window']) {
      saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      Object.defineProperty(globalThis, key, { configurable: true, value: f[key] });
    }
    try {
      await import(new URL('../app.js?startup-test=' + format, import.meta.url));
      await requested.promise;
      assert.equal(f.counts().mediaCalls, 1);
      assert.equal(f.nodes.start, undefined);
      assert.equal(f.nodes.stop, undefined);
      assert.equal(f.nodes.retry.hidden, true);
      f.window.fire('pagehide');
      permission.resolve(f.stream); await tick();
      assert.ok(f.counts().stopped > 0);
      assert.equal(f.nodes.video.srcObject, null);
    } finally {
      f.window.fire('pagehide');
      permission.resolve(f.stream); await tick();
      for (const [key, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  }
});

test('failed scanner cleanup still stops tracks and allows a new scan', async () => {
  const f = fixture({ stopError: true }); await f.app.start(); f.app.stop();
  assert.ok(f.counts().stopped > 0);
  assert.equal(f.nodes.video.srcObject, null);
  await f.app.start();
  assert.equal(f.counts().mediaCalls, 2);
  f.app.stop();
});
