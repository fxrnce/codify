// A product report that an admin resolved and published. The backend only
// returns these fields; reporter identity and photos are never included.
export type CommunityReport = {
  id: string;
  barcode: string | null;
  productName: string;
  brand: string;
  category: string;
  reason: string;
  notes: string;
  response: string;
  submittedAt: string;
  reviewedAt: string | null;
};

export type CommunityReportPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
