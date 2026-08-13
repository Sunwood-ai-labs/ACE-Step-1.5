---
layout: home
hero:
  name: ACE-Step Forge
  text: 生成したテイクを、きちんと残して使う。
  tagline: ACE-Step 1.5 のローカル音楽生成、共有 Library、そしてコーディングエージェント用 MCP をひとつにまとめたワークスペースです。
  actions:
    - theme: brand
      text: Forge 概要
      link: /ja/FORGE
    - theme: alt
      text: MCP セットアップ
      link: /ja/MCP
    - theme: alt
      text: 12 GB GPU 運用
      link: /ja/GPU_12GB
features:
  - icon: "✦"
    title: Create → Library
    details: 完成した曲を Forge サービス側に保存し、同じサービスを使うブラウザから再生できます。
  - icon: "⌘"
    title: localhost の MCP
    details: Claude Code や Codex から、同じ生成キューを Streamable HTTP で使えます。
  - icon: "◌"
    title: 安定した GPU 選択
    details: コンテナ内の番号ではなく GPU UUID を Compose に渡し、使うカードを明示します。
---

## 完成した曲を再生するところまで

![生成済みの曲を再生する ACE-Step Forge Library](/images/forge-library-playback.png)

これは実際にローカルで動作した Forge の画面です。和風ロックの生成が **Ready** になり、共有
Library に現れ、ブラウザのオーディオプレーヤーで再生されています。

[Forge 概要](./FORGE)から始め、必要に応じて [MCP セットアップ](./MCP) や
[12 GB GPU 運用](./GPU_12GB) を参照してください。

## v0.1.0

[リリースノート](./releases/v0.1.0) と
[v0.1.0 walkthrough](./guide/articles/ace-step-forge-v0-1-0) で、生成から
Library、ビジュアライザまでの検証済みフローを確認できます。
