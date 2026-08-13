import { afterEach, describe, expect, it, vi } from "vitest";
import { audioUrl, createVisualizer, deleteLibraryItem, getLibrary, getModels, parseResult, submitTask } from "./api";
import { defaultDraft } from "./types";

describe("ACE-Step API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parses a successful API result string", () => {
    const result = parseResult(JSON.stringify([{ file: "/v1/audio?path=take.mp3", metas: { bpm: 118 } }]));
    expect(result).toMatchObject({ file: "/v1/audio?path=take.mp3", metas: { bpm: 118 } });
  });

  it("does not throw for an invalid result payload", () => {
    expect(parseResult("not json")).toBeUndefined();
  });

  it("sends the official release_task contract through the API proxy", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { task_id: "job-1", status: "queued", queue_position: 2 }, code: 200, error: null }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await submitTask({ ...defaultDraft, prompt: "patient drums and salt air", bpm: "104" }, "local-token");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/release_task");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer local-token" });
    expect(JSON.parse(init.body as string)).toMatchObject({ prompt: "patient drums and salt air", bpm: 104, ai_token: "local-token" });
  });

  it("accepts ACE-Step's OpenRouter-compatible model list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ object: "list", data: [{ id: "acestep-v15-turbo" }] }), { status: 200 })));
    await expect(getModels("")).resolves.toEqual(["acestep-v15-turbo"]);
  });

  it("keeps returned audio behind the same-origin proxy", () => {
    expect(audioUrl("/v1/audio?path=take.mp3")).toBe("/api/v1/audio?path=take.mp3");
  });

  it("loads shared library items from the API rather than browser storage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { items: [{ id: "job-1:0", state: "ready" }] }, code: 200, error: null }), { status: 200 })));
    await expect(getLibrary("")).resolves.toMatchObject({ items: [{ id: "job-1:0" }] });
  });

  it("uses the shared library API when removing a completed take", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: "job-1:0", deleted: true }, code: 200, error: null }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await deleteLibraryItem("job-1:0", "local-token");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/library/job-1%3A0");
    expect(init).toMatchObject({ method: "DELETE", headers: { Authorization: "Bearer local-token" } });
  });

  it("queues a local visualizer against the shared Library item", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { aspect: "portrait", state: "rendering", updated_at: 1 }, code: 202, error: null }), { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createVisualizer("job-1:0", "portrait", "local-token")).resolves.toMatchObject({ state: "rendering" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/library/job-1%3A0/visualizers");
    expect(init).toMatchObject({ method: "POST", headers: { Authorization: "Bearer local-token" } });
    expect(JSON.parse(init.body as string)).toEqual({ aspect: "portrait" });
  });
});
