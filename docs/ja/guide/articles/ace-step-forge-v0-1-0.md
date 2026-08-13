---
title: ACE-Step Forge v0.1.0 walkthrough
description: 生成から Library 再生、ビジュアライザ書き出しまでを確認する短い手順です。
---

# ACE-Step Forge v0.1.0 walkthrough

![ACE-Step Forge v0.1.0 リリースヘッダー](/images/ace-step-forge-v0.1.0-release-header.png)

この walkthrough では、初回公開版の Forge をローカルで起動し、曲を生成して
Library で再生し、オーディオビジュアライザを書き出すまでを確認します。画面と
再生確認は、実際に起動した Forge アプリのものです。

## 1. ローカルスタックを起動する

```powershell
git clone https://github.com/Sunwood-ai-labs/ace-step-forge.git
Set-Location ace-step-forge
Copy-Item .env.example .env
docker compose up -d --build
```

`http://localhost:3000` を開きます。公式 ACE-Step API と Gradio UI は残したまま、
主な導線を React ワークスペースにしています。

## 2. 生成して Library で試聴する

1. **Create** を開き、`和風ロック、三味線、ライブドラム` のようなプロンプトを入力します。
2. text-to-music モードを選び、**Generate** を押します。
3. ジョブが **Ready** になるまで待ちます。完成音声は現在のブラウザだけでなく、
   サーバー側の Library に記録されます。
4. **Library** を開いて再生し、必要ならダウンロードします。

![生成済みの曲を再生できる Forge Library](/images/forge-library-playback.png)

## 3. ビジュアライザ動画を作る

Library のアイテムから **ビジュアライザを作成** を選び、アスペクト比を指定します。

- **16:9 横長** — YouTube、デスクトッププレビュー、リリースページ向け。
- **9:16 縦長** — ショート動画や SNS 投稿向け。

Forge は曲名、生成メタデータ、エディトリアルなアートワーク、音に同期する波形を
まとめたローカル H.264/AAC MP4 を生成します。完成音声からレンダリングするため、
モデル用 GPU は使いません。動画は Library アイテムに紐づき、ブラウザでプレビューして
からダウンロードできます。

## 4. コーディングエージェントを接続する

ローカルの Streamable HTTP MCP gateway からも同じ生成キューを呼び出せます。
Claude Code と Codex の設定は [MCP セットアップ](../../MCP) を参照してください。
MCP 経由で生成した曲も同じ Library に保存されるので、エージェントとブラウザで
ひとつのローカルコレクションを使えます。

## 次に読むページ

- 完全な UI リファレンス: [Forge ワークスペースガイド](../../FORGE)
- スコープと検証結果: [リリースノート](../../releases/v0.1.0)
- API 接続設定: [MCP セットアップ](../../MCP)
