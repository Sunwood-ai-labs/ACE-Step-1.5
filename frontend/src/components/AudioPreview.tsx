import { Download, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { audioUrl } from "../lib/api";

interface AudioPreviewProps {
  file: string;
  apiToken: string;
}

export function AudioPreview({ file, apiToken }: AudioPreviewProps) {
  const directUrl = audioUrl(file);
  const [source, setSource] = useState(apiToken ? "" : directUrl);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!apiToken) {
      setSource(directUrl);
      setError("");
      return;
    }

    let objectUrl = "";
    let active = true;
    setSource("");
    setError("");
    void fetch(directUrl, { headers: { Authorization: `Bearer ${apiToken}` } })
      .then((response) => {
        if (!response.ok) throw new Error(`Audio request returned ${response.status}.`);
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setSource(objectUrl);
      })
      .catch(() => active && setError("Could not load this protected audio file."));

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [apiToken, directUrl]);

  if (error) return <p className="task-error">{error}</p>;
  if (!source) return <p className="audio-loading"><LoaderCircle size={15} aria-hidden="true" /> Preparing audio preview…</p>;
  return <div className="audio-result"><audio controls preload="metadata" src={source} aria-label="Preview generated track" /><a className="icon-button" href={source} download title="Download generated audio" aria-label="Download generated audio"><Download size={16} aria-hidden="true" /></a></div>;
}
