import type {
  FdaAdvisory,
  FdaAdvisoryCategory,
  FdaAdvisoryPagination,
  FdaAdvisoryStatus,
} from "@/types/fda-advisory";
import {
  cacheAdvisories,
  getCachedAdvisory,
  queryCachedAdvisories,
  removeCachedAdvisory,
  replaceCachedAdvisories,
} from "@/services/offline-catalog";

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

class AdvisoryHttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "AdvisoryHttpError";
  }
}

async function parseResponse<T extends { message?: string }>(
  response: Response,
) {
  const responseBody = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    throw new AdvisoryHttpError(
      responseBody.message ||
        `Unable to load FDA advisories (${response.status}).`,
      response.status,
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

  try {
    const response = await fetch(
      `${getApiUrl()}/api/advisories?${parameters.toString()}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      },
    );
    const responseBody = await parseResponse<AdvisoryListResponse>(response);
    const advisories = Array.isArray(responseBody.advisories)
      ? responseBody.advisories
      : [];
    const updatedThrough = responseBody.updatedThrough ?? "";
    await cacheAdvisories(advisories, updatedThrough);
    return {
      advisories,
      pagination: responseBody.pagination ?? {
        page: 1,
        limit: filters.limit ?? 20,
        total: 0,
        totalPages: 0,
      },
      updatedThrough,
      source: "online" as const,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    const cached = await queryCachedAdvisories(filters);
    if (cached.pagination.total > 0) {
      return { ...cached, source: "offline" as const };
    }
    throw error;
  }
}

export async function fetchFdaAdvisory(
  advisoryNumber: string,
  signal?: AbortSignal,
) {
  const cached = await getCachedAdvisory(advisoryNumber);
  try {
    const response = await fetch(
      `${getApiUrl()}/api/advisories/${encodeURIComponent(advisoryNumber)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      },
    );
    const responseBody = await parseResponse<AdvisoryDetailResponse>(response);
    if (!responseBody.advisory) {
      throw new Error("FDA advisory not found.");
    }
    const updatedThrough = responseBody.updatedThrough ?? "";
    await cacheAdvisories([responseBody.advisory], updatedThrough);
    return {
      advisory: responseBody.advisory,
      updatedThrough,
      source: "online" as const,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    if (error instanceof AdvisoryHttpError && error.status === 404) {
      await removeCachedAdvisory(advisoryNumber);
      throw error;
    }
    if (cached) {
      const metadata = await queryCachedAdvisories({ limit: 1 });
      return {
        advisory: cached,
        updatedThrough: metadata.updatedThrough,
        source: "offline" as const,
      };
    }
    throw error;
  }
}

export async function refreshFdaAdvisoryCache(signal?: AbortSignal) {
  const advisories: FdaAdvisory[] = [];
  let page = 1;
  let totalPages = 1;
  let updatedThrough = "";
  do {
    const parameters = new URLSearchParams({
      page: String(page),
      limit: "50",
    });
    const response = await fetch(
      `${getApiUrl()}/api/advisories?${parameters.toString()}`,
      { method: "GET", headers: { Accept: "application/json" }, signal },
    );
    const body = await parseResponse<AdvisoryListResponse>(response);
    advisories.push(...(Array.isArray(body.advisories) ? body.advisories : []));
    updatedThrough = body.updatedThrough ?? updatedThrough;
    totalPages = body.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);
  await replaceCachedAdvisories(advisories, updatedThrough);
  return advisories.length;
}
