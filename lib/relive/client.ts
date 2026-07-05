// Client-side helpers for the Relive Control Room.

export async function api<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export function fmtTime(isoOrTime: string): string {
  const d = new Date(isoOrTime);
  if (isNaN(d.getTime())) return isoOrTime;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function fmtDay(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fmtAgo(iso: string): string {
  const d = new Date(iso.includes('T') || iso.includes('Z') ? iso : iso + 'Z');
  if (isNaN(d.getTime())) return iso;
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
