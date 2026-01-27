const DEFAULT_BASE_URL = "http://localhost:8000";
const DEV_PROXY_BASE_URL = "/api";

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl && envUrl.trim()) return envUrl;
  return import.meta.env.DEV ? DEV_PROXY_BASE_URL : DEFAULT_BASE_URL;
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

export type AnalyzeResponse = Record<string, unknown>;
export type RoutePlacePayload = {
  id?: number | null;
  name?: string | null;
  lat: number;
  lng: number;
};
export type RouteResponse = {
  status: string;
  start_point?: { lat: number; lng: number };
  data?: RoutePlacePayload[];
};

export type RouteHistoryPlace = {
  id?: number | null;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  lat: number;
  lng: number;
  order_index?: number | null;
};

export type RouteHistoryItem = {
  route_id: number;
  created_at: string;
  start_point?: { lat: number; lng: number };
  places?: RouteHistoryPlace[];
};

export type RouteHistoryListResponse = {
  status: string;
  routes: RouteHistoryItem[];
};

export const analyzeImages = async (files: File[], currentLat?: number, currentLng?: number) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (typeof currentLat === "number") formData.append("current_lat", String(currentLat));
  if (typeof currentLng === "number") formData.append("current_lng", String(currentLng));

  return apiFetch<AnalyzeResponse>(
    "/analyze",
    {
      method: "POST",
      body: formData,
    },
    false
  );
};

export const calculateRoute = async (payload: {
  start_lat: number;
  start_lng: number;
  places: RoutePlacePayload[];
}) => {
  return apiFetch<RouteResponse>(
    "/route",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );
};

export const getRouteHistory = async () => {
  return apiFetch<RouteHistoryListResponse>("/routes", { method: "GET" }, true);
};

export const createRouteHistory = async (payload: {
  start_lat: number;
  start_lng: number;
  places: RoutePlacePayload[];
}) => {
  return apiFetch<Record<string, unknown>>(
    "/routes",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );
};

export const deleteRouteHistory = async (routeId: number) => {
  return apiFetch<Record<string, unknown>>(
    `/routes/${routeId}`,
    {
      method: "DELETE",
    },
    true
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

export const uploadPlacePhoto = async (placeId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<Record<string, unknown>>(
    `/places/${placeId}/photo`,
    {
      method: "POST",
      body: formData,
    },
    false
  );
};

export const getPlacePhoto = async (placeId: number) => {
  return apiFetch<Record<string, unknown>>(
    `/places/${placeId}/photo`,
    {
      method: "GET",
    },
    true
  );
};
