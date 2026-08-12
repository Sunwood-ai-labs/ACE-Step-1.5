# 12 GB GPU 運用

このガイドは、RTX 3060 のような 12 GB GPU を 1 枚使い、同じワークステーションにある別 GPU を
他の用途のために空けておきたい場合のものです。広いハードウェア性能を主張するものではなく、
Compose に使うカードを明示し、コア生成を優先するときは optional の 5 Hz planner をそのカード上で
ロードしないようにする運用です。

## 1. UUID で GPU を選ぶ

ホストの GPU を確認します。

```powershell
nvidia-smi -L
```

使いたい `GPU-...` UUID を、Git 管理されない `.env` にコピーします。

```dotenv
ACESTEP_GPU_DEVICE_ID=GPU-<uuid-from-nvidia-smi-L>
```

`0` や `1` より UUID を推奨します。Docker Desktop ではコンテナに見える GPU 番号の順序がホストと
異なることがあるため、UUID の方が曖昧さがありません。

## 2. core-generation profile を使う

12 GB で LLM planning を使わない場合は、次を追加します。

```dotenv
ACESTEP_INIT_LLM=false
```

その後、該当サービスを作り直します。

```powershell
docker compose up -d --force-recreate acestep acestep-mcp forge
```

この設定は API 起動時に ACE-Step の 5 Hz language-model planner を無効にします。GPU を選ぶ設定でも、
別 GPU を空ける設定でもありません。すでに選択した 12 GB カード上で optional LLM をロードしないことが
目的です。

| 設定 | 結果 |
| --- | --- |
| `ACESTEP_GPU_DEVICE_ID=GPU-…` | ACE-Step Compose が使える GPU を、指定したホスト GPU に制限します。 |
| `ACESTEP_INIT_LLM=false` | optional planner / LLM 強化入力を無効にします。コア生成は使えます。 |
| `ACESTEP_INIT_LLM=auto` | GPU 検出に基づいて ACE-Step に判断させます。 |
| `ACESTEP_INIT_LLM=true` | planner 初期化を強制します。VRAM に余裕がある場合だけ使ってください。 |

## 3. 実際にコンテナで見えている GPU を確認する

ホスト側の設定だけでは証拠になりません。稼働中の API コンテナを確認します。

```powershell
docker exec acestep-api uv run python -c "import torch; print(torch.cuda.device_count()); print(torch.cuda.get_device_name(0))"
```

意図したカード名で、CUDA device が 1 つだけ表示されることを期待します。続けて Compose が
コンテナへ渡した UUID を確認します。

```powershell
docker inspect acestep-api --format '{{range .Config.Env}}{{println .}}{{end}}' `
  | Select-String '^(CUDA|NVIDIA)_VISIBLE_DEVICES='
```

Docker Desktop では、PyTorch から見える CUDA device を 1 つに制限していても、`nvidia-smi` が
ホストの物理 GPU を列挙することがあります。上の PyTorch 結果と `CUDA_VISIBLE_DEVICES` /
`NVIDIA_VISIBLE_DEVICES` の両方で確認してください。最後に短い曲を生成し、**Ready** になるまで待ち、
Forge の **Library** で再生してください。Windows の WDDM desktop では別 GPU に System や表示処理が
見える場合があります。重要なのは、空けたいカードに ACE-Step / Docker の compute process が乗っていないことです。

## planning を明示的に戻す

planner 機能が必要になったら、`.env` を `ACESTEP_INIT_LLM=auto` または `true` に変更し、API
container を作り直してから、十分な VRAM があることを確認してください。Forge UI は API が提供する
範囲を表示するものであり、選択した GPU のメモリ上限を越えることはできません。
