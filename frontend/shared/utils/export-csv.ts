/**
 * Generic "download an array of flat objects as a CSV file" helper — genuinely
 * functional (not a placeholder) client-side formatting utility. Used by the
 * Admin Audit Log and Reports pages to export their (mocked) data; the
 * export mechanism itself is real, only the underlying rows are mocked.
 */
export function exportRowsToCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns: { key: keyof T; header: string }[],
): void {
  if (typeof window === "undefined" || rows.length === 0) return;

  const escapeCell = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = columns.map((column) => escapeCell(column.header)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCell(row[column.key])).join(","))
    .join("\n");

  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
