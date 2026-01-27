const DEFAULT_BASE_URL = "http://localhost:8000";

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (envUrl && envUrl.trim()) || DEFAULT_BASE_URL;
};

export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

export const setAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

const buildHeaders = (isJson: boolean) => {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const apiFetch = async <T>(path: string, options: RequestInit, isJson = true): Promise<T> => {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(isJson),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};

export const authKakao = async (code: string) => {
  return apiFetch<Record<string, unknown>>(
    "/auth/kakao",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
    true
  );
};

export const analyzeImages = async (files: File[], currentLat?: number, currentLng?: number) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (typeof currentLat === "number") formData.append("current_lat", String(currentLat));
  if (typeof currentLng === "number") formData.append("current_lng", String(currentLng));

  return apiFetch<Record<string, unknown>>(
    "/analyze",
    {
      method: "POST",
      body: formData,
    },
    false
  );
};

export type VerifyVisitParams = {
  userId: number;
  placeId: number;
  lat: number;
  lng: number;
  file: File;
};

export const verifyVisit = async ({ userId, placeId, lat, lng, file }: VerifyVisitParams) => {
  const formData = new FormData();
  formData.append("user_id", String(userId));
  formData.append("place_id", String(placeId));
  formData.append("lat", String(lat));
  formData.append("lng", String(lng));
  formData.append("file", file);

  return apiFetch<Record<string, unknown>>(
    "/visits",
    {
      method: "POST",
      body: formData,
    },
    false
  );
};

export const getMyMap = async () => {
  return apiFetch<Record<string, unknown>>("/my-map", { method: "GET" }, true);
};

export const getUsers = async () => {
  return apiFetch<Record<string, unknown>>("/users", { method: "GET" }, true);
};
