const DECODE_MISSES = new Set(['NotFoundException', 'ChecksumException', 'FormatException']);

export function isDecodeMiss(error) {
  return DECODE_MISSES.has(error?.getKind?.());
}

function cameraError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'カメラを利用できません。ブラウザの設定で、このサイトのカメラを許可してください。';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return '利用できるカメラが見つかりません。';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'カメラを起動できません。他のアプリで使用中の場合は閉じてください。';
    default:
      return '読み取りを開始できませんでした。ページを再読み込みしてお試しください。';
  }
}

export function createBarcodeReader({
  document = globalThis.document,
  navigator = globalThis.navigator,
  window = globalThis.window,
  createReader,
} = {}) {
  const ui = Object.fromEntries(['retry', 'preview', 'video', 'status', 'result', 'code', 'copyClose']
    .map((id) => [id, document.getElementById(id)]));
  const available = window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);
  let session = null, starting = false, copying = false, attempted = false, code = '';

  function status(message) {
    ui.status.textContent = message;
  }

  function render() {
    ui.retry.hidden = !available || !attempted || starting || Boolean(session);
    ui.retry.disabled = starting || Boolean(session) || copying;
    ui.retry.textContent = code ? '読み直す' : '再試行';
    ui.preview.hidden = !session;
    ui.result.hidden = !code;
    ui.copyClose.hidden = !code;
    ui.copyClose.disabled = !code || copying;
  }

  function stopTracks(stream) {
    stream?.getTracks().forEach((track) => { try { track.stop(); } catch { /* 他のトラックの解放も続ける。 */ } });
  }

  function stopControls(controls) {
    try { Promise.resolve(controls?.stop()).catch(() => {}); } catch { /* カメラは別途必ず解放する。 */ }
  }

  function release() {
    const previous = session;
    session = null;
    stopControls(previous?.controls);
    stopTracks(previous?.stream);
    ui.video.pause();
    ui.video.srcObject = null;
    render();
  }

  function stop() {
    if (!session) return;
    release();
    status('読み取りを停止しました。');
  }

  async function start() {
    if (!available || document.hidden || starting || session || copying) return;
    attempted = true;
    const run = { stream: null, controls: null };
    session = run;
    starting = true;
    code = '';
    ui.code.value = '';
    render();
    status('カメラを準備しています。使用許可を求められたら許可してください。');
    try {
      run.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (session !== run) { stopTracks(run.stream); return; }
      run.stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (session !== run) return;
          release();
          status('カメラが停止しました。再試行してください。');
        }, { once: true });
      });
      const reader = await createReader();
      if (session !== run) return;
      const controls = await reader.decodeFromStream(run.stream, ui.video, (result, error, scanControls) => {
        if (session !== run) return;
        // 最初の結果はdecodeFromStreamのPromiseが解決する前に届くこともある。
        run.controls = scanControls;
        if (result) {
          const text = result.getText();
          if (typeof text !== 'string' || !text.length) return;
          code = text;
          ui.code.value = text;
          release();
          status('読み取りました。');
          ui.copyClose.focus();
        } else if (error && !isDecodeMiss(error)) {
          release();
          status('読み取り中に問題が発生しました。再試行してください。');
        }
      });
      run.controls = controls;
      if (session !== run) stopControls(controls);
      else status('バーコードをカメラに映してください。距離や角度を少しずつ変えると読み取りやすくなります。');
    } catch (error) {
      if (session === run) {
        release();
        status(cameraError(error));
      }
    } finally {
      starting = false;
      render();
    }
  }

  async function copy() {
    if (!code || copying) return false;
    copying = true;
    render();
    try {
      // 数字への変換やtrimをせず、先頭の0・改行なども読み取り結果のままコピーする。
      await navigator.clipboard.writeText(code);
      status('コピーしました。閉じられない場合は、このタブを閉じてください。');
      try { window.close(); } catch { /* コピー成功は維持し、タブは利用者に閉じてもらう。 */ }
      return true;
    } catch {
      ui.code.focus();
      ui.code.select();
      status('自動コピーできませんでした。読み取り結果を長押しするか、選択してコピーしてください。');
      return false;
    } finally {
      copying = false;
      render();
    }
  }

  ui.retry.addEventListener('click', () => { void start(); });
  ui.copyClose.addEventListener('click', () => { void copy(); });
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!attempted) void start();
  });
  if (!available) status(window.isSecureContext
    ? 'このブラウザではカメラを利用できません。SafariやChromeなどで開いてください。'
    : 'カメラを利用するにはHTTPSのページを開いてください。');
  render();
  return { start, stop, copy };
}
