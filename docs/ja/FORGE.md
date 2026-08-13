# Forge ワークスペース

ACE-Step Forge は、公式 ACE-Step 1.5 REST API を中心にしたローカル向けワークスペースです。
上流のモデル実行系や同梱 Gradio UI を置き換えるものではありません。生成を開始し、状態を追い、
完成した音声を残し、あとから再生する通常の流れを、専用の UI にまとめます。

![完成した曲を再生する Forge Library](/images/forge-library-playback.png)

## スタックを起動する

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

`http://localhost:3000` を開きます。すでに使われているときは `.env` の `FORGE_PORT` を変更します。
ブラウザは Forge の `/api` プロキシを通すため、別 API origin や CORS 例外は不要です。

## 画面ごとの役割

| 画面 | 役割 |
| --- | --- |
| **Create** (`/`) | 既存の ACE-Step API を使い、text / cover / repaint の生成を開始します。 |
| **Library** (`/library`) | 完成した曲を共有コレクションで確認し、ブラウザで再生・ダウンロード、横長 16:9 / SNS向け縦長 9:16 の音声同期MP4を作成、または Library レコードを削除します。 |
| **MCP** (`/mcp`) | Claude Code / Codex のコマンド、公開ツール、localhost 専用のセキュリティ方針を確認します。 |
| **System** (`/system`) | サービス到達性を確認し、API が必要な場合だけブラウザローカルのトークンを設定します。 |

## Library が共有される理由

API ジョブが成功すると、Forge は返却された音声を `gradio_outputs/forge-library/audio` にコピーし、
カタログを `gradio_outputs/forge-library` に保存します。Library 画面はこのサーバー側カタログを読むため、
ブラウザ 1 台の localStorage には依存しません。

## ビジュアライザ動画を作る

完成した Library の各曲には **ビジュアライザ動画** パネルがあります。既定はSNS向けの縦長 9:16で、
横長 16:9 も選べます。**SNSビデオを作成** を押すと、Forge はローカルの FFmpeg で一度に1本だけ
レンダリングします。完成した H.264/AAC MP4 は曲名・生成情報・落ち着いたエディトリアルフレーム・
音に同期する波形をまとめ、`gradio_outputs/forge-library/visualizers/video` に保存します。完了すると、
同じLibraryカードにプレーヤーとダウンロードリンクが表示されます。

ビジュアライザは完成した音声から直接作られ、外部の動画サービスへ曲をアップロードしません。また、
ACE-Step のモデル用 GPU も使用しません。

リリース時には、次の順に実際に確認してください。

1. **Create** から短い曲を生成します。
2. **Ready** になるまで待ちます。
3. **Library** を開き、新しい行が増えたことを確認します。
4. ブラウザのオーディオプレーヤーを再生し、時間表示が進むことを確認します。

## API 境界

| Forge の操作 | ACE-Step endpoint |
| --- | --- |
| サービス状態・モデル情報 | `GET /health`, `GET /v1/models` |
| タスク作成 | `POST /release_task` |
| タスクの状態確認 | `POST /query_result` |
| 音声の再生・ダウンロード | プロキシされた `/v1/audio` URL |

上流の Gradio UI も別途起動できます。

```powershell
docker compose --profile legacy up acestep-gradio
```

VRAM に十分な余裕がない限り、legacy Gradio とモデルをロード済みの API worker を、1 枚の GPU で
同時に動かさないでください。

次は [MCP をつなぐ](./MCP) か [12 GB GPU を設定する](./GPU_12GB) を参照してください。
