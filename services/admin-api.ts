export type AdminRole = "USER" | "ADMIN";
export type AdminReportStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "REJECTED";

export type AdminReport = {
  id: string;
  productId: string | null;
  barcode: string | null;
  productName: string;
  brand: string;
  category: string;
  reason: string;
  notes: string;
  status: AdminReportStatus;
  resolutionNote: string;
  submittedAt: string;
  reviewedAt: string | null;
  updatedAt: string;
};

export type AdminProductSummary = {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  category: string;
  status: string;
  isArchived: boolean;
  updatedAt: string;
};

export type AdminProduct = AdminProductSummary & {
  slug: string;
  fdaStatusLabel: string;
  registrationNumber: string;
  healthScore: number | null;
  servingSize: string;
  warningMessage: string;
  imageUrl: string | null;
  verificationUrl: string | null;
  nutrition: Record<
    | "calories"
    | "protein"
    | "carbohydrates"
    | "totalFat"
    | "saturatedFat"
    | "totalSugars"
    | "dietaryFiber"
    | "sodium",
    string
  > | null;
  ingredients: { name: string; isAllergen: boolean }[];
  allergens: { name: string }[];
  alternatives: { name: string }[];
};

export type AdminAdvisory = {
  id: string;
  advisoryNumber: string;
  title: string;
  category: string;
  type: string;
  status: string;
  publishedAt: string;
  sourceUrl: string;
  filipinoSourceUrl: string | null;
  isActive: boolean;
  updatedAt: string;
};

export type AdminPage = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

export type AdminFieldError = { path: string; message: string };

export class AdminApiError extends Error {
  fieldErrors?: AdminFieldError[];

  constructor(message: string, fieldErrors?: AdminFieldError[]) {
    super(message);
    this.name = "AdminApiError";
    this.fieldErrors = fieldErrors;
  }
}

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export async function checkApiReachability() {
  if (!API_URL) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function request<T>(
  getToken: GetToken,
  path: string,
  options: RequestInit,
) {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is missing.");
  const token = await getToken();
  if (!token) throw new Error("Your session expired. Sign in again.");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    errors?: AdminFieldError[];
  };
  if (!response.ok) {
    throw new AdminApiError(
      body.message || `Request failed (${response.status}).`,
      body.errors,
    );
  }
  return body;
}

export function adminRequest<T>(
  getToken: GetToken,
  path: string,
  options: RequestInit = {},
) {
  return request<T>(getToken, `/api/admin${path}`, options);
}

export function authenticatedRequest<T>(
  getToken: GetToken,
  path: string,
  options: RequestInit = {},
) {
  return request<T>(getToken, path, options);
}
