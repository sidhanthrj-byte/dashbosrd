export type Audience = "homeowner" | "architect" | "explorer";

const KEY = "pongs-audience";

export function getAudience(): Audience | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "homeowner" || v === "architect" || v === "explorer" ? v : null;
}

export function setAudience(a: Audience) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, a);
  window.dispatchEvent(new CustomEvent("pongs-audience", { detail: a }));
}
