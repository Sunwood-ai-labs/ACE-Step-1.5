---
title: ACE-Step Forge v0.1.0 walkthrough
description: A short, verified path from generation to Library playback and visualizer export.
---

# ACE-Step Forge v0.1.0 walkthrough

![ACE-Step Forge v0.1.0 release header](/images/ace-step-forge-v0.1.0-release-header.png)

This walkthrough follows the first public Forge release from a fresh local stack to a
finished take in Library, then to a shareable audio visualizer. The screenshots and
playback check come from the running Forge application.

## 1. Start the local stack

```powershell
git clone https://github.com/Sunwood-ai-labs/ace-step-forge.git
Set-Location ace-step-forge
Copy-Item .env.example .env
docker compose up -d --build
```

Open `http://localhost:3000`. Forge keeps the official ACE-Step API and Gradio UI
available, while the React workspace is the primary flow.

## 2. Generate and audition a take

1. Open **Create** and enter a prompt, such as `Japanese folk rock, shamisen, live drums`.
2. Choose the text-to-music mode and press **Generate**.
3. Wait for the job to reach **Ready**. The completed audio is recorded by the server-side
   Library, not only in the current browser tab.
4. Open **Library**, press play, and use the download action when you want the source audio.

![The running Forge Library with a generated track ready for playback](/images/forge-library-playback.png)

## 3. Make a visualizer video

From a Library item, choose **Create visualizer** and select an aspect ratio:

- **16:9 landscape** for YouTube, desktop previews, and release pages.
- **9:16 portrait** for short-form social posts.

Forge renders a local H.264/AAC MP4 with the track title, generation metadata, editorial
artwork, and an audio-synchronised waveform. Rendering uses the completed audio; it does
not consume the model GPU. The video is kept with the Library item and can be previewed
in the browser before downloading.

## 4. Connect a coding agent

The same queue is exposed through the local Streamable HTTP MCP gateway. Follow the
[MCP setup guide](../../MCP) for Claude Code and Codex configuration. A take generated
through MCP is stored in the same Library, so the agent and the browser see one local
collection.

## Next steps

- Read the [Forge workspace guide](../../FORGE) for the complete UI reference.
- Check the [release notes](../../releases/v0.1.0) for scope and validation evidence.
- For a lower-level API view, see the [MCP setup guide](../../MCP).
