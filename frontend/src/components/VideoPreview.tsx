import { Download, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { audioUrl } from "../lib/api";
import { useLocale } from "../i18n/LocaleProvider";
import { getWorkspaceCopy } from "../i18n/workspaceCopy";

interface VideoPreviewProps {
  file: string;
  apiToken: string;
}

export function VideoPreview({ file, apiToken }: VideoPreviewProps) {
  const { locale } = useLocale();
  const copy = getWorkspaceCopy(locale).task.visualizer;
  const directUrl = audioUrl(file);
  const downloadName = file.split("/").pop()?.split("?")[0] || "visualizer.mp4";
  const [source, setSource] = useState(apiToken ? "" : directUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!apiToken) {
      setSource(directUrl);
      setHasError(false);
      return;
    }
    let objectUrl = "";
    let active = true;
    setSource("");
    setHasError(false);
    void fetch(directUrl, { headers: { Authorization: `Bearer ${apiToken}` } })
      .then((response) => {
        if (!response.ok) throw new Error(`Video request returned ${response.status}.`);
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setSource(objectUrl);
      })
      .catch(() => active && setHasError(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [apiToken, directUrl]);

  if (hasError) return <p className="task-error">{copy.error}</p>;
  if (!source) return <p className="audio-loading"><LoaderCircle size={15} aria-hidden="true" /> {copy.loading}</p>;
  return <div className="video-result"><video controls playsInline preload="metadata" src={source} aria-label={copy.preview} /><a className="icon-button" href={source} download={downloadName} title={copy.download} aria-label={copy.download}><Download size={16} aria-hidden="true" /></a></div>;
}
