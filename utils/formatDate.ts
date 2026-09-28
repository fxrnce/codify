// Manual, Intl-independent date formatting.
//
// `toLocaleString`/`toLocaleDateString` rely on the JS engine's Intl/ICU
// data. On some Hermes/Android builds that data isn't available, and the
// formatter silently falls back to UTC instead of the device's real
// timezone — showing scan/sync times several hours off from the clock.
// `Date.prototype.getHours()` and friends are plain ECMAScript and always
// reflect the device's actual local timezone, so we use those directly.

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatClockTime(date: Date) {
  const hours24 = date.getHours();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours12}:${minutes} ${period}`;
}

/** e.g. "Sep 28, 11:37 AM" or, with includeYear, "Sep 28, 2026, 11:37 AM" */
export function formatDateTime(
  value: string | Date | number,
  options: { includeYear?: boolean } = {},
) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = SHORT_MONTHS[date.getMonth()];
  const day = date.getDate();
  const time = formatClockTime(date);

  return options.includeYear
    ? `${month} ${day}, ${date.getFullYear()}, ${time}`
    : `${month} ${day}, ${time}`;
}

/** e.g. "Sep 28, 2026" */
export function formatDateOnly(value: string | Date | number) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** e.g. "September 2026" */
export function formatMonthYear(value: string | Date | number) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${LONG_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
