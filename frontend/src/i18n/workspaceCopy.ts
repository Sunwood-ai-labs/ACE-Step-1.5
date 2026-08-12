import type { ServiceState, TaskState, TaskType } from "../lib/types";
import type { Locale } from "./locale";

export function getWorkspaceCopy(locale: Locale) {
  if (locale === "ja") {
    return {
      forge: {
        inspectorLabel: "生成サービスの詳細",
        noteLabel: "制作メモ",
        noteTitle: "ジャンル名ではなく、情景を渡す。",
        noteBody: "素材、場所、動き、感情が変わる瞬間を描写してください。必要なときだけテンポやキーを足します。",
        queueLabel: "レンダーキュー",
        queueTitle: "いま形になっているもの",
      },
      library: {
        eyebrow: "共有コレクション",
        title: "完成したテイクを、すぐ手元に。",
        body: "完成した音声は Forge に保存されるため、このワークスペースのどのデバイスからでも聴けます。",
        readyCount: "再生準備完了",
        finished: "完成",
        collect: "聴く・集める",
        elsewhere: "ほかのジョブ",
        inProgress: "まだ進行中",
      },
      metrics: { label: "生成の概要", active: "生成中", ready: "完成", failed: "確認が必要" },
      task: {
        emptyLabel: "生成ジョブはありません",
        emptyTitle: "まだ曲はありません。",
        emptyBody: "完成した音声は、すべての Forge デバイスでここに表示されます。",
        untitled: "名前のない生成",
        remove: "共有ライブラリから削除",
        taskType: { text2music: "テキストから音楽", cover: "カバー", repaint: "リペイント" } as Record<TaskType, string>,
        state(state: TaskState, queuePosition?: number) {
          if (state === "ready") return "準備完了";
          if (state === "failed") return "確認が必要";
          if (state === "working") return "レンダリング中";
          return queuePosition ? `待機中 · #${queuePosition}` : "待機中";
        },
        timeLocale: "ja-JP",
        preview: "生成した曲をプレビュー",
        download: "生成した音声をダウンロード",
        audioLoading: "音声プレビューを準備中…",
        audioError: "保護された音声ファイルを読み込めませんでした。",
      },
      service: {
        eyebrow: "ローカルサービス",
        state(state: ServiceState) {
          if (state === "online") return "接続済み";
          if (state === "checking") return "確認中";
          return "利用不可";
        },
        summary(state: ServiceState, initialized?: boolean) {
          if (state === "online") return initialized ? "モデルを初期化済み" : "API に接続しました";
          if (state === "checking") return "ローカルサービスを確認中";
          return "サービスを利用できません";
        },
        onlineBody: "このワークスペースの背後にある ACE-Step コンテナ内で生成されます。",
        offlineBody: "画面は安全に確認できます。API が応答するまで生成は無効です。",
        model: "DiT モデル",
        serverDefault: "サーバー既定",
        planner: "5Hz プランナー",
        initialized: "初期化済み",
        onDemand: "オンデマンド",
        refresh: "状態を更新",
      },
      notice: {
        generationReview: "生成結果を確認してください。",
        trackReady: "生成した曲は共有ライブラリで再生できます。",
        saved: "共有ライブラリに保存しました。",
        waitingLibrary: "生成は完了しました。共有ライブラリへの保存を確認中です。",
        refreshQueue: "生成キューを更新できませんでした。",
        queued(position?: number) { return `キューに追加しました${position ? ` · #${position}` : ""}。`; },
        submitFailed: "この生成を送信できませんでした。",
        removed: "共有ライブラリから削除しました。",
        removeFailed: "このライブラリアイテムを削除できませんでした。",
      },
    };
  }

  return {
    forge: {
      inspectorLabel: "Generation service details",
      noteLabel: "Working note",
      noteTitle: "Give the engine a scene, not a genre tag.",
      noteBody: "Describe material, room, movement, and the point of emotional change. Then add only the tempo or key you truly need.",
      queueLabel: "Render queue",
      queueTitle: "What is taking shape",
    },
    library: {
      eyebrow: "Shared collection",
      title: "Your finished takes, close at hand.",
      body: "Completed audio is kept by Forge, so every device on this workspace can audition it.",
      readyCount: "ready to audition",
      finished: "Finished",
      collect: "Audition & collect",
      elsewhere: "Elsewhere",
      inProgress: "Still in progress",
    },
    metrics: { label: "Generation summary", active: "In motion", ready: "Finished", failed: "Needs review" },
    task: {
      emptyLabel: "No generation jobs",
      emptyTitle: "No jobs yet.",
      emptyBody: "Finished audio will appear here for every Forge device.",
      untitled: "Untitled generation",
      remove: "Remove from shared library",
      taskType: { text2music: "text to music", cover: "cover", repaint: "repaint" } as Record<TaskType, string>,
      state(state: TaskState, queuePosition?: number) {
        if (state === "ready") return "Ready";
        if (state === "failed") return "Needs review";
        if (state === "working") return "Rendering";
        return queuePosition ? `Queued · #${queuePosition}` : "Queued";
      },
      timeLocale: "en-US",
      preview: "Preview generated track",
      download: "Download generated audio",
      audioLoading: "Preparing audio preview…",
      audioError: "Could not load this protected audio file.",
    },
    service: {
      eyebrow: "Local service",
      state(state: ServiceState) {
        if (state === "online") return "Online";
        if (state === "checking") return "Checking";
        return "Unavailable";
      },
      summary(state: ServiceState, initialized?: boolean) {
        if (state === "online") return initialized ? "Models initialized" : "API is reachable";
        if (state === "checking") return "Checking local service";
        return "Service unavailable";
      },
      onlineBody: "Generation stays on the ACE-Step container behind this workspace.",
      offlineBody: "The interface remains safe to explore; generation is disabled until the API responds.",
      model: "DiT model",
      serverDefault: "Server default",
      planner: "5Hz planner",
      initialized: "Initialized",
      onDemand: "On demand",
      refresh: "Refresh status",
    },
    notice: {
      generationReview: "Generation needs review.",
      trackReady: "Your generated track is ready in the shared library.",
      saved: "Saved to the shared library.",
      waitingLibrary: "Generation finished; waiting for shared library confirmation.",
      refreshQueue: "Unable to refresh the generation queue.",
      queued(position?: number) { return `Queued${position ? ` at position ${position}` : ""}.`; },
      submitFailed: "Could not submit this generation.",
      removed: "Removed from the shared library.",
      removeFailed: "Could not remove this library item.",
    },
  };
}
