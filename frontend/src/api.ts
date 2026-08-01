import type { Analytics, Experiment, ResponsePayload } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Something went wrong" }));
    throw new Error(error.detail ?? "Something went wrong");
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ authenticated: boolean; username: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ authenticated: boolean }>("/api/auth/logout", { method: "POST" }),
  session: () => request<{ authenticated: boolean; username: string }>("/api/auth/session"),
  listExperiments: () => request<Experiment[]>("/api/experiments"),
  getExperiment: (id: number) => request<Experiment>(`/api/experiments/${id}`),
  getAnalytics: (id: number) => request<Analytics>(`/api/experiments/${id}/analytics`),
  submitResponse: (id: number, payload: ResponsePayload) =>
    request(`/api/experiments/${id}/responses`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  exportUrl: (id: number) => `${API_URL}/api/experiments/${id}/responses.csv`,
};
