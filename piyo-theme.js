// ╔════════════════════════════════════════════════════════════╗
// ║ ぴよツールズ ダークモード制御                                ║
// ║                                                            ║
// ║ - localStorage に保存された設定を読んで html[data-theme] 設定 ║
// ║ - 未設定なら OS の prefers-color-scheme に追従              ║
// ║ - 各ページに <button class="theme-toggle"> があれば自動配線   ║
// ║                                                            ║
// ║ <head> の早い段階で読み込むと、テーマのチラつきを防げる     ║
// ╚════════════════════════════════════════════════════════════╝
(function () {
  const KEY = 'piyo-theme';
  const root = document.documentElement;

  function getStored() { try { return localStorage.getItem(KEY); } catch { return null; } }
  function setStored(v) { try { localStorage.setItem(KEY, v); } catch {} }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    // 各テーマ切替ボタンの aria-label / title も更新
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      const next = theme === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替';
      btn.setAttribute('aria-label', next);
      btn.title = next;
    });
  }

  // 初期適用（DOMContentLoaded を待たない・フラッシュ防止）
  const stored = getStored();
  const initial = stored ? stored : (systemPrefersDark() ? 'dark' : 'light');
  apply(initial);

  // OSテーマ変化に追従（明示設定がない時のみ）
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getStored()) apply(e.matches ? 'dark' : 'light');
    });
  }

  // 公開API
  window.piyoToggleTheme = function () {
    const next = (root.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
    apply(next);
    setStored(next);
  };

  // DOM 構築後、テーマ切替ボタンに自動でハンドラを設定
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', window.piyoToggleTheme);
      // ボタン中身が空の場合、デフォルトの☀️🌙アイコンを差し込む
      if (!btn.innerHTML.trim()) {
        btn.innerHTML = `
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        `;
      }
    });
    // 初期 aria-label
    apply(root.getAttribute('data-theme'));
  });
})();

// ╔════════════════════════════════════════════════════════════╗
// ║ ポモドーロ・ウォッチャー（全ページ共通）                     ║
// ║                                                            ║
// ║ - localStorage の "piyo-pomodoro-active" を1秒ごとに監視     ║
// ║ - 走行中なら画面左下にピル型ウィジェットを表示              ║
// ║ - 時間切れになったら和音チャイムを鳴らす                   ║
// ║ - クリックで pomodoro.html に戻る                          ║
// ╚════════════════════════════════════════════════════════════╝
(function () {
  const STORE_KEY = 'piyo-pomodoro-active';
  const PHASE_LABEL = { 'focus': '集中', 'break': '休憩', 'long-break': '長休憩' };
  let audioCtx = null;
  let widget = null;

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
  }
  function writeState(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
  }
  function fmtTime(sec) {
    const s = Math.max(0, Math.ceil(sec));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  // 心地よいチャイム（Cメジャー和音 + ベル風減衰）
  function playAlarm() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = 'sine';
        const t0 = t + i * 0.12;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.18, t0 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.2);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 2.3);
      });
    } catch (e) { /* 音再生不可は無視 */ }
  }

  function ensureWidget() {
    if (widget) return widget;
    widget = document.createElement('a');
    widget.id = 'piyo-pomo-watcher';
    widget.href = 'pomodoro.html';
    widget.title = 'ポモドーロタイマーへ戻る';
    const iconEl  = document.createElement('span'); iconEl.textContent = '🍅';
    const timeEl  = document.createElement('span'); timeEl.className = 'piyo-pomo-time';  timeEl.textContent = '00:00';
    const labelEl = document.createElement('span'); labelEl.className = 'piyo-pomo-label';
    widget.appendChild(iconEl);
    widget.appendChild(timeEl);
    widget.appendChild(labelEl);
    document.body.appendChild(widget);
    return widget;
  }

  function hideWidget() {
    if (widget) widget.classList.remove('active');
  }

  function setRunningFlag(running) {
    if (running) document.documentElement.setAttribute('data-pomo-running', 'true');
    else         document.documentElement.removeAttribute('data-pomo-running');
  }

  function tick() {
    const s = readState();
    const remainMs = (s && s.endTimeMs) ? (s.endTimeMs - Date.now()) : 0;
    // ヘッダーのぴよちゃんの目をぐるぐる回す制御（全ページ共通）
    setRunningFlag(!!(s && s.endTimeMs && remainMs > 0));

    // ポモドーロページ自体ではウィジェット非表示（タイマー表示と重複するため）
    if (/pomodoro\.html$/.test(location.pathname)) { hideWidget(); return; }

    if (!s || !s.endTimeMs) { hideWidget(); return; }

    const w = ensureWidget();
    w.classList.add('active');

    if (remainMs <= 0) {
      w.dataset.phase = 'done';
      w.querySelector('.piyo-pomo-time').textContent = '完了';
      w.querySelector('.piyo-pomo-label').textContent = (PHASE_LABEL[s.phase] || '') + ' 終了';
      if (!s.alarmFired) {
        playAlarm();
        s.alarmFired = true;
        writeState(s);
        if ('Notification' in window && Notification.permission === 'granted') {
          try { new Notification('ぴよツールズ ポモドーロ', { body: (PHASE_LABEL[s.phase] || '') + ' 終了！' }); } catch {}
        }
      }
      return;
    }

    w.dataset.phase = s.phase;
    w.querySelector('.piyo-pomo-time').textContent = fmtTime(remainMs / 1000);
    w.querySelector('.piyo-pomo-label').textContent = PHASE_LABEL[s.phase] || '';
  }

  document.addEventListener('DOMContentLoaded', () => {
    tick();
    setInterval(tick, 1000);
  });
})();
