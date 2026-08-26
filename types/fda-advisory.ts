export type FdaAdvisoryCategory = "FOOD" | "DRUG" | "COSMETIC";

export type FdaAdvisoryType =
  | "PUBLIC_HEALTH_WARNING"
  | "RECALL"
  | "QUALITY_HOLD"
  | "SAFETY_ALERT"
  | "LIFTING";

export type FdaAdvisoryStatus = "NOT_APPROVED" | "CAUTION" | "LIFTED";

export type FdaAdvisory = {
  advisoryNumber: string;
  title: string;
  category: FdaAdvisoryCategory;
  categoryLabel: string;
  type: FdaAdvisoryType;
  typeLabel: string;
  status: FdaAdvisoryStatus;
  statusLabel: string;
  publishedAt: string;
  sourceUrl: string;
  filipinoSourceUrl: string | null;
  isActive: boolean;
};

export type FdaAdvisoryPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
