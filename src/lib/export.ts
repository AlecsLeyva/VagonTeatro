import * as XLSX from "xlsx";

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

export function exportToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = "Datos",
): void {
  const data = rows.map((row) => {
    const record: Record<string, string | number> = {};
    for (const col of columns) {
      record[col.header] = col.value(row);
    }
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const widths = columns.map((col) => ({
    wch: Math.max(
      col.header.length,
      ...data.map((row) => String(row[col.header] ?? "").length),
      12,
    ),
  }));
  worksheet["!cols"] = widths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function printView(): void {
  window.print();
}
