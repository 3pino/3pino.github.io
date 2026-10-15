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
  const ui = Object.fromEntries(['start', 'stop', 'preview', 'video', 'status', 'result', 'code', 'copy', 'copyClose']
    .map((id) => [id, document.getElementById(id)]));
  const available = window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);
  let session = null, starting = false, copying = false, code = '';

  function status(message) {
    ui.status.textContent = message;
  }

  function render() {
    ui.start.disabled = !available || starting || Boolean(session) || copying;
    ui.start.textContent = starting ? 'カメラを起動中…' : code ? 'もう一度読み取る' : '読み取りを開始';
    ui.stop.hidden = !session;
    ui.preview.hidden = !session;
    ui.result.hidden = !code;
    ui.copy.disabled = !code || copying;
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
    if (!available || starting || session || copying) return;
    const run = { stream: null, controls: null };
    session = run;
    starting = true;
    code = '';
    ui.code.value = '';
    render();
    status('カメラを準備しています。使用許可を求められたら許可してください。');
    try {
      const reader = await createReader();
      if (session !== run) return;
      run.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (session !== run) { stopTracks(run.stream); return; }
      run.stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (session !== run) return;
          release();
          status('カメラが停止しました。もう一度読み取りを開始してください。');
        }, { once: true });
      });
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
          status('読み取り中に問題が発生しました。もう一度読み取りを開始してください。');
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

  async function copy(close = false) {
    if (!code || copying) return false;
    copying = true;
    render();
    try {
      // 数字への変換やtrimをせず、先頭の0・改行なども読み取り結果のままコピーする。
      await navigator.clipboard.writeText(code);
      if (close) {
        status('コピーしました。閉じられない場合は、このタブを閉じてください。');
        try { window.close(); } catch { /* コピー成功は維持し、タブは利用者に閉じてもらう。 */ }
      } else status('コピーしました。');
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

  ui.start.addEventListener('click', start);
  ui.stop.addEventListener('click', stop);
  ui.copy.addEventListener('click', () => { void copy(); });
  ui.copyClose.addEventListener('click', () => { void copy(true); });
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  if (!available) status(window.isSecureContext
    ? 'このブラウザではカメラを利用できません。SafariやChromeなどで開いてください。'
    : 'カメラを利用するにはHTTPSのページを開いてください。');
  render();
  return { start, stop, copy };
}
