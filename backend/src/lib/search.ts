export function buildTextSearch(fields: readonly string[], query: string) {
  const operator = query.length === 1 ? "startsWith" : "contains";

  return fields.map((field) => ({
    [field]: {
      [operator]: query,
      mode: "insensitive" as const,
    },
  }));
}
