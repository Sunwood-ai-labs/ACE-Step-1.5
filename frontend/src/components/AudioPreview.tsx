import { Download, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { audioUrl } from "../lib/api";
import { useLocale } from "../i18n/LocaleProvider";
import { getWorkspaceCopy } from "../i18n/workspaceCopy";

interface AudioPreviewProps {
  file: string;
  apiToken: string;
}

export function AudioPreview({ file, apiToken }: AudioPreviewProps) {
  const { locale } = useLocale();
  const copy = getWorkspaceCopy(locale).task;
  const directUrl = audioUrl(file);
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
        if (!response.ok) throw new Error(`Audio request returned ${response.status}.`);
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

  if (hasError) return <p className="task-error">{copy.audioError}</p>;
  if (!source) return <p className="audio-loading"><LoaderCircle size={15} aria-hidden="true" /> {copy.audioLoading}</p>;
  return <div className="audio-result"><audio controls preload="metadata" src={source} aria-label={copy.preview} /><a className="icon-button" href={source} download title={copy.download} aria-label={copy.download}><Download size={16} aria-hidden="true" /></a></div>;
}
