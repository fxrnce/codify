import { formatAdvisoryDate } from "@/components/advisories/advisory-appearance";

// Keyed by the report reasons offered on the Report Product form.
export function getCommunityReasonAppearance(reason: string) {
  if (reason === "No FDA record found") {
    return {
      background: "#FEF2F2",
      border: "#FECACA",
      color: "#B91C1C",
      icon: "search" as const,
    };
  }

  if (reason === "Possible counterfeit") {
    return {
      background: "#FEF2F2",
      border: "#FECACA",
      color: "#B91C1C",
      icon: "alert-circle" as const,
    };
  }

  if (reason === "Suspicious product") {
    return {
      background: "#FFFBEB",
      border: "#FDE68A",
      color: "#92400E",
      icon: "warning" as const,
    };
  }

  if (reason === "Wrong product information") {
    return {
      background: "#EEF2FF",
      border: "#C7D2FE",
      color: "#4338CA",
      icon: "document-text" as const,
    };
  }

  return {
    background: "#F1F5F9",
    border: "#E2E8F0",
    color: "#475569",
    icon: "help-circle" as const,
  };
}

// Formats an ISO timestamp as the device's local calendar date.
export function formatCommunityReportDate(isoValue: string) {
  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatAdvisoryDate(
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
  );
}
