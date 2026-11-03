/**
 * Single gateway to the Zebella backend (Python API, owned by the backend team).
 *
 * Works in both browser and server code. Base URL comes from NEXT_PUBLIC_API_URL
 * (e.g. https://api.zebelladesigns.com/v1). In the browser the session token is kept in
 * localStorage and sent as `Authorization: Bearer <token>`.
 *
 * Expected error shape from the API: { "error": "human readable message", "code"?: "SOME_CODE" }.
 */
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const TOKEN_KEY = "zebella.token";

/**
 * Demo mode: no backend URL set, so the app runs on built-in sample data (src/lib/mock) — sign-in accepts any
 * username/password and checkout is disabled. Set NEXT_PUBLIC_API_URL to use the real backend, or
 * NEXT_PUBLIC_USE_MOCK=false to turn the sample data off.
 */
export const useMockApi: boolean = BASE.length === 0 && process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const isApiConfigured = (): boolean => BASE.length > 0 || useMockApi;

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const tokenStore = {
  get(): string | null {
    try { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token: string | null): void {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch { /* private mode: session lasts until reload */ }
  },
};

/** fetch() against the backend with the session token attached. Returns the raw Response. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (useMockApi) return (await import("../mock/api")).mockFetch(path, init);
  if (!BASE) throw new ApiError("The store backend is not configured.", 0, "API_NOT_CONFIGURED");
  const token = tokenStore.get();
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/** JSON helper: parses the body and throws ApiError (with the server's message) on non-2xx. */
export async function apiJson<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await apiFetch(path, json === undefined ? rest : { ...rest, method: rest.method ?? "POST", body: JSON.stringify(json) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? data.detail ?? "Something went wrong. Please try again.", res.status, data.code);
  return data as T;
}
