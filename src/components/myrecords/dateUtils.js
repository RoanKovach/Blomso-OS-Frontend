import { format } from "date-fns";

/**
 * Format a date-only string (YYYY-MM-DD) without timezone shifting.
 * Using new Date('YYYY-MM-DD') is interpreted as UTC midnight, which can
 * display as the previous day in local time. This helper parses as local
 * date parts and formats so the calendar date is preserved.
 * @param {string} value - Date string (ideally YYYY-MM-DD)
 * @param {string} formatStr - date-fns format string (default 'MMM d, yyyy')
 * @returns {string} Formatted date or empty string if invalid
 */
export function formatDateOnlySafe(value, formatStr = "MMM d, yyyy") {
    if (value == null || value === "") return "";
    const str = String(value).trim();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        const [, y, m, d] = match;
        const year = parseInt(y, 10);
        const month = parseInt(m, 10) - 1;
        const day = parseInt(d, 10);
        const date = new Date(year, month, day);
        if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
            return "";
        }
        return format(date, formatStr);
    }
    try {
        const date = new Date(str);
        return isNaN(date.getTime()) ? "" : format(date, formatStr);
    } catch {
        return "";
    }
}
