# Streamable HTTP MCP

Forge には、Web ワークスペースと同じ ACE-Step API キューを使う MCP gateway が含まれています。
エージェントが生成した曲も、Forge が表示する同じサーバー側 Library に保存されます。

## ローカル接続

まず Compose を起動します。

```powershell
docker compose up -d
```

MCP endpoint は意図的にローカルマシンだけに bind されています。

```text
http://127.0.0.1:8002/mcp
```

クライアントへ登録します。

```powershell
# Claude Code（現在の project scope）
claude mcp add --transport http ace-step-forge http://127.0.0.1:8002/mcp

# Codex CLI
codex mcp add ace-step-forge --url http://127.0.0.1:8002/mcp
```

## 利用できるツール

| ツール | 用途 |
| --- | --- |
| `generate_music` | ACE-Step へ音楽生成リクエストを送ります。 |
| `get_generation_status` | 1 つのタスクのキュー・完了状態を取得します。 |
| `wait_for_generation` | 生成の最終結果まで待ちます。 |
| `list_music_library` | 共有の完成済み Library を一覧します。 |
| `get_music_server_status` | MCP と下流サービスの状態を確認します。 |

たとえば「三味線、太鼓、歪んだギターの 10 秒和風ロック・インストゥルメンタルを作り、完了まで待って、
Library item と audio URL を教えて」と依頼できます。エージェントは `generate_music`、
`wait_for_generation`、必要なら `list_music_library` を順に呼びます。

## 任意の Bearer token 保護

秘密値は、Git 管理されない `.env` だけに設定します。

```dotenv
ACESTEP_MCP_API_KEY=replace-with-a-long-random-token
```

gateway を再起動した後、コマンド履歴や Git に秘密値を残さないよう、環境変数経由でクライアントに渡します。

```powershell
$env:ACESTEP_MCP_API_KEY = "replace-with-a-long-random-token"

codex mcp add ace-step-forge --url http://127.0.0.1:8002/mcp `
  --bearer-token-env-var ACESTEP_MCP_API_KEY

claude mcp add --transport http ace-step-forge http://127.0.0.1:8002/mcp `
  --header "Authorization: Bearer $env:ACESTEP_MCP_API_KEY"
```

実際の秘密値は `.env.example`、コミット、スクリーンショット、プロンプトログに入れないでください。

## Tailnet で使う場合も一般公開にはしない

Compose の port は localhost 専用です。Tailnet 上の別デバイスから使う場合も、Compose を気軽に
`0.0.0.0` に変更せず、Tailscale Serve/ACLs をローカルサービスの前段に置きます。

MCP に届く正確な host と、クライアントが `/v1/audio` へ実際に到達できる API base URL を設定します。

```dotenv
ACESTEP_MCP_ALLOWED_HOSTS=localhost:*,127.0.0.1:*,[::1]:*,forge-host.tailnet-name.ts.net
ACESTEP_MCP_PUBLIC_API_BASE_URL=https://forge-host.tailnet-name.ts.net/api
```

Tailnet URL は Tailnet 内だけの URL であり、インターネットへの一般公開 URL ではありません。
