/**
 * Authentication endpoints of the Python backend — the ONLY place these paths and payloads live.
 * The backend team supplies the real contract; adjust the paths / field names below to match.
 *
 * Every call goes through apiJson(), so errors surface as ApiError with the server's message
 * ({ "error": "message" } or FastAPI-style { "detail": "message" }).
 */
import { apiJson } from "./client";
import type { Profile, User } from "@/components/providers/AuthProvider";

export interface Session { token: string; user: User; profile?: Profile }

export const authApi = {
  /** POST /auth/login  { username, password }  ->  { token, user, profile? }.  `username` may also be an email. */
  login: (username: string, password: string) =>
    apiJson<Session>("/auth/login", { json: { username, password } }),

  /** POST /auth/register  { name, username, email, password }  ->  { token, user, profile? } */
  register: (a: { name: string; username: string; email: string; password: string }) =>
    apiJson<Session>("/auth/register", { json: a }),

  /** POST /auth/password-reset  { identifier }  — emails a reset link. Must respond 200 even if the account doesn't exist. */
  requestPasswordReset: (identifier: string) =>
    apiJson<unknown>("/auth/password-reset", { json: { identifier } }),

  /** POST /auth/password-reset/confirm  { token, password }  — token comes from the emailed link (/reset-password?token=...). */
  confirmPasswordReset: (token: string, password: string) =>
    apiJson<unknown>("/auth/password-reset/confirm", { json: { token, password } }),

  /** GET /auth/me  ->  { user, profile? } */
  me: () => apiJson<{ user: User; profile?: Profile }>("/auth/me", { method: "GET" }),

  /** POST /auth/logout  (best effort) */
  logout: () => apiJson<unknown>("/auth/logout", { json: {} }),
};
