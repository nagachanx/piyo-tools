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
