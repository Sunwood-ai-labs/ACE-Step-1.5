import type { ServiceState } from "../lib/types";
import type { Locale } from "./locale";

export function getShellCopy(locale: Locale) {
  if (locale === "ja") {
    return {
      skipLink: "メインコンテンツへ移動",
      navigationLabel: "主なナビゲーション",
      workspace: "ワークスペース",
      navigation: {
        create: { label: "作成", hint: "新しい曲を生成する" },
        library: { label: "ライブラリ", hint: "完成した曲を聴く" },
        mcp: { label: "MCP", hint: "Claude Code や Codex を接続する" },
        system: { label: "システム", hint: "接続と API を設定する" },
      },
      pageMeta(pathname: string) {
        if (pathname === "/library") return ["共有コレクション", "ライブラリ"] as const;
        if (pathname === "/mcp") return ["エージェント音楽ブリッジ", "MCP"] as const;
        if (pathname === "/system") return ["接続コントロール", "システム"] as const;
        return ["新しいトラック", "作成"] as const;
      },
      serviceLabel(state: ServiceState) {
        if (state === "online") return "API 接続済み";
        if (state === "checking") return "API を確認中";
        return "API に接続できません";
      },
      localServiceNote: "すべてのジョブはローカルの ACE-Step サービスでレンダリングされます。",
      sourceApi: "ソースと API",
      languageLabel: "表示言語",
      switchToEnglish: "English に切り替える",
      switchToJapanese: "日本語に切り替える",
      activeJobs(count: number) {
        return count ? `${count} 件を生成中` : "キューは空です";
      },
    };
  }

  return {
    skipLink: "Skip to main content",
    navigationLabel: "Primary navigation",
    workspace: "Workspace",
    navigation: {
      create: { label: "Create", hint: "Compose a new generation" },
      library: { label: "Library", hint: "Listen to finished work" },
      mcp: { label: "MCP", hint: "Connect Claude Code or Codex" },
      system: { label: "System", hint: "Connection and API access" },
    },
    pageMeta(pathname: string) {
      if (pathname === "/library") return ["Shared collection", "Library"] as const;
      if (pathname === "/mcp") return ["Agent music bridge", "MCP"] as const;
      if (pathname === "/system") return ["Connection control", "System"] as const;
      return ["A quieter way to start a track", "Create"] as const;
    },
    serviceLabel(state: ServiceState) {
      if (state === "online") return "API ready";
      if (state === "checking") return "Checking API";
      return "API unavailable";
    },
    localServiceNote: "All jobs are rendered by your local ACE-Step service.",
    sourceApi: "Source & API",
    languageLabel: "Language",
    switchToEnglish: "Switch to English",
    switchToJapanese: "Switch to Japanese",
    activeJobs(count: number) {
      return count ? `${count} job${count === 1 ? "" : "s"} in motion` : "Queue clear";
    },
  };
}
