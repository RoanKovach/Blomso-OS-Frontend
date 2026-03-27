/**
 * Minimal CSV helpers for client-side export (Data Sheet visible rows/columns).
 */

function escapeCsvCell(val) {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

/**
 * @param {string} filename - e.g. saved-records-2026-03-27.csv
 * @param {string[]} headers
 * @param {string[][]} dataRows
 */
export function downloadCsv(filename, headers, dataRows) {
    const lines = [
        headers.map(escapeCsvCell).join(","),
        ...dataRows.map((row) => row.map(escapeCsvCell).join(",")),
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}
