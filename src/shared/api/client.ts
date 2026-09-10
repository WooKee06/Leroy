const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:4000/api";

const TOKEN_KEY = "8676979215:AAFjqIR60Wz-zxO_KJoa-ELmi7EddWYifQM";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

interface RequestOptions {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: string;
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method,
      headers,
      body: options.body,
    });
  } catch {
    throw new ApiError(0, "Нет соединения с сервером");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const data = body as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message)
      ? data!.message.join(", ")
      : data?.message;
    throw new ApiError(res.status, message || `Request failed: ${res.status}`);
  }

  const data = body as { data?: T } | null;
  return data?.data as T;
}

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const http = {
  get<T>(path: string, query?: object): Promise<T> {
    return request<T>(path + (query ? buildQuery(query) : ""), {
      method: "GET",
    });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};
