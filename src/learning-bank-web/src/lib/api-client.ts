const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api/v1";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText);
  }

  // Some successful API operations return no response body (e.g. 201/204).
  if (res.status === 204) return undefined as T;

  const raw = await res.text();
  if (!raw.trim()) return undefined as T;

  return JSON.parse(raw) as T;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
