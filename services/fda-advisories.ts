import type {
  FdaAdvisory,
  FdaAdvisoryCategory,
  FdaAdvisoryPagination,
  FdaAdvisoryStatus,
} from "@/types/fda-advisory";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

type AdvisoryListResponse = {
  success?: boolean;
  message?: string;
  updatedThrough?: string;
  advisories?: FdaAdvisory[];
  pagination?: FdaAdvisoryPagination;
};

type AdvisoryDetailResponse = {
  success?: boolean;
  message?: string;
  updatedThrough?: string;
  advisory?: FdaAdvisory;
};

export type AdvisorySearchFilters = {
  query?: string;
  category?: FdaAdvisoryCategory;
  status?: FdaAdvisoryStatus;
  page?: number;
  limit?: number;
};

function getApiUrl() {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is missing.");
  }

  return API_URL;
}

async function parseResponse<T extends { message?: string }>(
  response: Response,
) {
  const responseBody = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    throw new Error(
      responseBody.message ||
        `Unable to load FDA advisories (${response.status}).`,
    );
  }

  return responseBody;
}

export async function fetchFdaAdvisories(
  filters: AdvisorySearchFilters = {},
  signal?: AbortSignal,
) {
  const parameters = new URLSearchParams();
  const query = filters.query?.trim();

  if (query) {
    parameters.set("q", query);
  }

  if (filters.category) {
    parameters.set("category", filters.category);
  }

  if (filters.status) {
    parameters.set("status", filters.status);
  }

  parameters.set("page", String(filters.page ?? 1));
  parameters.set("limit", String(filters.limit ?? 20));

  const response = await fetch(
    `${getApiUrl()}/api/advisories?${parameters.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );
  const responseBody = await parseResponse<AdvisoryListResponse>(response);

  return {
    advisories: Array.isArray(responseBody.advisories)
      ? responseBody.advisories
      : [],
    pagination: responseBody.pagination ?? {
      page: 1,
      limit: filters.limit ?? 20,
      total: 0,
      totalPages: 0,
    },
    updatedThrough: responseBody.updatedThrough ?? "2026-08-07",
  };
}

export async function fetchFdaAdvisory(
  advisoryNumber: string,
  signal?: AbortSignal,
) {
  const response = await fetch(
    `${getApiUrl()}/api/advisories/${encodeURIComponent(advisoryNumber)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );
  const responseBody = await parseResponse<AdvisoryDetailResponse>(response);

  if (!responseBody.advisory) {
    throw new Error("FDA advisory not found.");
  }

  return {
    advisory: responseBody.advisory,
    updatedThrough: responseBody.updatedThrough ?? "2026-08-07",
  };
}
