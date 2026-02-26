export function exportAsCsv(rows: any[]) {
  if (!rows.length) return '';
  const headers = [
    'id',
    'mode',
    'started_at',
    'completed_at',
    'initial_input',
    'mirror_text',
    'pattern_text',
    'reframe_question',
    'user_resolution'
  ];

  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    if (/[",\n]/.test(s)) return `"${s}"`;
    return s;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  const csv = lines.join('\n');
  return 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
}
