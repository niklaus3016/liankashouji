export function isSameDay(tsA: number, tsB: number): boolean {
  const a = new Date(tsA);
  const b = new Date(tsB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(tsA: number, tsB: number): boolean {
  const a = new Date(tsA);
  const b = new Date(tsB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isWithinCurrentWeek(ts: number, nowTs = Date.now()): boolean {
  const now = new Date(nowTs);
  const day = now.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
  const nextMonday = new Date(monday.getTime() + 7 * 86400000);
  return ts >= monday.getTime() && ts < nextMonday.getTime();
}

export function formatTimeHM(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateMD(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatFullDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toDatetimeLocalValue(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatPrice(price: number | null): string {
  if (price === null || Number.isNaN(price)) return '';
  return `¥${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
}

export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
