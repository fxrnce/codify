import type {
  CommunityReport,
  CommunityReportPagination,
} from "@/types/community-report";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

type CommunityReportListResponse = {
  success?: boolean;
  message?: string;
  reports?: CommunityReport[];
  pagination?: CommunityReportPagination;
};

type CommunityReportDetailResponse = {
  success?: boolean;
  message?: string;
  report?: CommunityReport;
};

export type CommunityReportFilters = {
  barcode?: string;
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
        `Unable to load community reports (${response.status}).`,
    );
  }

  return responseBody;
}

// Community reports are moderated content that can change at any time, so
// unlike FDA advisories they are not cached for offline use.
export async function fetchCommunityReports(
  filters: CommunityReportFilters = {},
  signal?: AbortSignal,
) {
  const parameters = new URLSearchParams();

  if (filters.barcode) {
    parameters.set("barcode", filters.barcode);
  }

  parameters.set("page", String(filters.page ?? 1));
  parameters.set("limit", String(filters.limit ?? 20));

  const response = await fetch(
    `${getApiUrl()}/api/community-reports?${parameters.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    },
  );
  const responseBody =
    await parseResponse<CommunityReportListResponse>(response);

  return {
    reports: Array.isArray(responseBody.reports) ? responseBody.reports : [],
    pagination: responseBody.pagination ?? {
      page: 1,
      limit: filters.limit ?? 20,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function fetchCommunityReport(id: string, signal?: AbortSignal) {
  const response = await fetch(
    `${getApiUrl()}/api/community-reports/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    },
  );
  const responseBody =
    await parseResponse<CommunityReportDetailResponse>(response);

  if (!responseBody.report) {
    throw new Error("Community report not found.");
  }

  return responseBody.report;
}
