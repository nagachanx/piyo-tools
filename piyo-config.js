// ╔════════════════════════════════════════════════════════════════╗
// ║ ぴよツールズ 共通設定                                            ║
// ║                                                                ║
// ║ Supabase 接続情報を一箇所で管理。schedule.html / lottery.html  ║
// ║ ほか、サーバー保存が必要なツールはここから読み込みます。         ║
// ║                                                                ║
// ║ Supabase の URL とキーを更新するときはここだけ書き換えれば、    ║
// ║ 全ツールに反映されます。                                        ║
// ╚════════════════════════════════════════════════════════════════╝
window.PIYO_CONFIG = {
  SUPABASE_URL: 'https://dltjyzbkunmqbwlqimom.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_UYgUnnL91iQ35XyiSBlpkg_Qdycx7Bh',
  // 予約フォームの主催者宛通知メール用 Power Automate Webhook URL
  // 設定方法は docs/superpowers/specs/booking-power-automate-setup.md を参照
  // 空文字のままなら通知はスキップされます（予約自体は成功）
  BOOKING_NOTIFY_URL: ''
};
