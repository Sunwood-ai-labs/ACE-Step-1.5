interface MetricStripProps {
  active: number;
  ready: number;
  failed: number;
}

export function MetricStrip({ active, ready, failed }: MetricStripProps) {
  return (
    <dl className="metric-strip" aria-label="Generation summary">
      <div><dt>In motion</dt><dd>{active}</dd></div>
      <div><dt>Finished</dt><dd>{ready}</dd></div>
      <div><dt>Needs review</dt><dd>{failed}</dd></div>
    </dl>
  );
}
