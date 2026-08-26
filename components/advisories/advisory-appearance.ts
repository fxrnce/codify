import type { FdaAdvisoryStatus } from "@/types/fda-advisory";

export function getAdvisoryAppearance(status: FdaAdvisoryStatus) {
  if (status === "CAUTION") {
    return {
      background: "#FFFBEB",
      border: "#FDE68A",
      color: "#D97706",
      icon: "warning" as const,
      gradient: ["#F59E0B", "#EA580C"] as const,
    };
  }

  if (status === "LIFTED") {
    return {
      background: "#ECFDF5",
      border: "#A7F3D0",
      color: "#059669",
      icon: "checkmark-circle" as const,
      gradient: ["#10B981", "#059669"] as const,
    };
  }

  return {
    background: "#FEF2F2",
    border: "#FECACA",
    color: "#DC2626",
    icon: "close-circle" as const,
    gradient: ["#EF4444", "#DC2626"] as const,
  };
}

export function formatAdvisoryDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${monthNames[month - 1] ?? ""} ${day}, ${year}`;
}
