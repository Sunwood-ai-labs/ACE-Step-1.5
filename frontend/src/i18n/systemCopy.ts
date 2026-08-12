import type { Locale } from "./locale";

export function getSystemCopy(locale: Locale) {
  if (locale === "ja") {
    return {
      apiAccess: "API アクセス",
      connectionTitle: "接続設定",
      connectionBody: "Compose のプロキシにより、ブラウザはひとつのオリジンに留まります。API で <code>ACESTEP_API_KEY</code> を有効にしている場合だけトークンを入力してください。",
      token: "API トークン",
      tokenPlaceholder: "任意のローカルトークン",
      showToken: "トークンを表示",
      hideToken: "トークンを隠す",
      save: "ローカル設定を保存",
      clear: "消去",
      saved: "このブラウザに保存しました。次の API 確認では新しいトークンを使います。",
      privacy: "この値はこのブラウザのローカルストレージにだけ保存され、フロントエンドのビルドには含まれません。",
      contract: "連携コントラクト",
      contractTitle: "UI は公式 REST API と会話します。",
      release: "任意の元音声・参照音声とともに生成をキューへ追加",
      query: "キューを確認し、返却された音声を表示",
      health: "キーを公開せずに利用可能なローカルサービスを表示",
    };
  }

  return {
    apiAccess: "API access",
    connectionTitle: "Connection settings",
    connectionBody: "The Compose proxy keeps the browser on one origin. Enter a token only when <code>ACESTEP_API_KEY</code> is enabled on the API.",
    token: "API token",
    tokenPlaceholder: "Optional local token",
    showToken: "Show token",
    hideToken: "Hide token",
    save: "Save local setting",
    clear: "Clear",
    saved: "Saved in this browser. The next API check uses the new token.",
    privacy: "This value is stored only in this browser’s local storage and is never placed in the frontend build.",
    contract: "Integration contract",
    contractTitle: "The UI speaks the official REST API.",
    release: "queue a generation, with optional source and reference audio",
    query: "poll the queue and reveal returned audio",
    health: "show the available local service without exposing a key",
  };
}
