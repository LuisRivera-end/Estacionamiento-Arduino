type RequestOptions = RequestInit & {
  accessToken?: string;
  useFixture?: boolean;
};

export type ApiError = {
  error: string;
  message: string;
  request_id?: string;
};

function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  return apiBaseUrl;
}

export async function apiGet<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    cache: "no-store",
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const apiError = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(apiError?.message ?? `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const apiError = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(apiError?.message ?? `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const apiError = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(apiError?.message ?? `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
