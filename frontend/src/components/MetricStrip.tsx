import { useLocale } from "../i18n/LocaleProvider";
import { getWorkspaceCopy } from "../i18n/workspaceCopy";

interface MetricStripProps {
  active: number;
  ready: number;
  failed: number;
}

export function MetricStrip({ active, ready, failed }: MetricStripProps) {
  const { locale } = useLocale();
  const copy = getWorkspaceCopy(locale);
  return (
    <dl className="metric-strip" aria-label={copy.metrics.label}>
      <div><dt>{copy.metrics.active}</dt><dd>{active}</dd></div>
      <div><dt>{copy.metrics.ready}</dt><dd>{ready}</dd></div>
      <div><dt>{copy.metrics.failed}</dt><dd>{failed}</dd></div>
    </dl>
  );
}
