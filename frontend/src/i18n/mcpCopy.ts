import type { Locale } from "./locale";

export function getMcpCopy(locale: Locale) {
  if (locale === "ja") {
    return {
      hero: {
        eyebrow: "エージェント音楽ブリッジ",
        private: "既定でホスト内だけ",
        title: "コーディングエージェントから音楽を作る。",
        body: "Claude Code または Codex を Forge の Streamable HTTP gateway に接続すれば、エージェントの会話を離れずに生成、待機、保存までできます。",
        endpoint: "Streamable HTTP エンドポイント",
        flowLabel: "MCP の生成フロー",
        flowHeading: "ひとつの依頼、ひとつの流れ",
        result: "Forge UI と同じ共有ライブラリに保存",
      },
      flow: [
        ["指示する", "エージェントが音楽の要望を Forge ジョブに変えます。"],
        ["生成する", "ACE-Step が同じ共有キューでレンダリングします。"],
        ["受け取る", "完成した MP3 が Forge Library に届きます。"],
      ],
      start: {
        step: "手順 1",
        title: "Forge と gateway を起動する。",
        body: "Compose は API と Forge UI と一緒に MCP sidecar を起動します。Docker Compose を動かすマシンで実行してください。",
        command: "スタックを起動",
      },
      connect: {
        step: "手順 2",
        title: "エージェントを接続する。",
        body: "ひとつだけコマンドを選び、ローカルで実行します。endpoint は <code>127.0.0.1</code> で待ち受けるため、Tailnet 経由で Forge 画面を開いても、そのスマホや別の PC から gateway を使えるようにはなりません。",
        command(client: string) { return `${client} のコマンド`; },
        clients: {
          "claude-code": "現在のローカルプロジェクトのスコープに Forge を追加します。",
          codex: "Forge を Streamable HTTP MCP server として登録します。",
        } as Record<string, string>,
      },
      ask: {
        step: "手順 3",
        title: "曲を頼む。",
        steps: [
          "エージェントに、具体的な音楽の情景とともに <code>generate_music</code> を呼ぶよう頼みます。",
          "レンダリングが終わるまで <code>wait_for_generation</code> で待機します。",
          "完成音声を探すなら <code>list_music_library</code> を呼べます。",
        ],
        promptLabel: "試すプロンプト",
        prompt: "三味線、太鼓、歪んだギターの和風ロックを10秒生成して、完了まで待ち、Library に保存された曲を教えて。",
      },
      tools: {
        eyebrow: "gateway のツール",
        title: "5つの焦点を絞った操作。",
        description: {
          generate_music: "テキストから音楽を生成するジョブを追加します。",
          get_generation_status: "キューにあるひとつの生成状態を確認します。",
          wait_for_generation: "最終結果が返るまで待機します。",
          list_music_library: "Forge 内の完成した曲を探します。",
          get_music_server_status: "下流のサービスが準備できたか確認します。",
        } as Record<string, string>,
      },
      auth: {
        eyebrow: "任意の保護",
        title: "必要なときだけ Bearer token を要求する。",
        body: "Compose の <code>.env</code> に <code>ACESTEP_MCP_API_KEY</code> を設定し、stack を再起動してから、同じ環境変数をクライアントに登録します。実際の token はコマンド、コミット、スクリーンショットに残さないでください。",
        codexLabel: "Bearer token を使う Codex CLI",
        claudeLabel: "Bearer token を使う Claude Code",
        docs: "MCP の詳しいセットアップを開く",
      },
    };
  }

  return {
    hero: {
      eyebrow: "Agent music bridge",
      private: "Host-only by default",
      title: "Make music from your coding agent.",
      body: "Connect Claude Code or Codex to Forge’s Streamable HTTP gateway, then generate, wait, and collect a track without leaving your agent session.",
      endpoint: "Streamable HTTP endpoint",
      flowLabel: "MCP generation flow",
      flowHeading: "One request, one path",
      result: "Same shared Library as the Forge UI",
    },
    flow: [
      ["Describe", "Your agent turns a music brief into a Forge job."],
      ["Generate", "ACE-Step renders through the same shared queue."],
      ["Collect", "The finished MP3 arrives in Forge Library."],
    ],
    start: {
      step: "Step 1",
      title: "Start Forge and the gateway.",
      body: "Compose starts the MCP sidecar with the API and Forge UI. Run this on the machine that hosts Docker Compose.",
      command: "Start the stack",
    },
    connect: {
      step: "Step 2",
      title: "Connect your agent.",
      body: "Choose one command and run it locally. The endpoint listens on <code>127.0.0.1</code>, so a Forge page opened through Tailnet does not make the gateway available on that phone or another computer.",
      command(client: string) { return `${client} command`; },
      clients: {
        "claude-code": "Add Forge to the current local project scope.",
        codex: "Register Forge as a Streamable HTTP MCP server.",
      } as Record<string, string>,
    },
    ask: {
      step: "Step 3",
      title: "Ask for a track.",
      steps: [
        "Ask the agent to call <code>generate_music</code> with a clear musical scene.",
        "It waits with <code>wait_for_generation</code> until the render finishes.",
        "It can call <code>list_music_library</code> to find the finished audio.",
      ],
      promptLabel: "Prompt to try",
      prompt: "Generate a 10-second Japanese rock instrumental with shamisen, taiko, and distorted guitar. Wait for completion, then tell me which track was saved in Library.",
    },
    tools: {
      eyebrow: "Gateway tools",
      title: "Five focused actions.",
      description: {
        generate_music: "Queue a text-to-music generation.",
        get_generation_status: "Check one queued generation.",
        wait_for_generation: "Wait for a terminal result.",
        list_music_library: "Find finished tracks in Forge.",
        get_music_server_status: "Confirm the backing service is ready.",
      } as Record<string, string>,
    },
    auth: {
      eyebrow: "Optional hardening",
      title: "Require a bearer token when you need one.",
      body: "Set <code>ACESTEP_MCP_API_KEY</code> in your Compose <code>.env</code>, restart the stack, then register the same environment variable with your client. Keep real tokens out of commands, commits, and screenshots.",
      codexLabel: "Codex CLI with a bearer token",
      claudeLabel: "Claude Code with a bearer token",
      docs: "Open the full MCP setup notes",
    },
  };
}
