function normalizeSearchValue(value: string | number | null | undefined) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

/**
 * A single character is treated as an initial, so "b" shows items whose
 * primary identity starts with B. Longer searches remain broad enough to
 * find categories, ingredients, statuses, and words in the middle of names.
 */
export function matchesCatalogSearch(
  query: string,
  primaryValues: readonly (string | number | null | undefined)[],
  secondaryValues: readonly (string | number | null | undefined)[] = [],
) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  const normalizedPrimaryValues = primaryValues.map(normalizeSearchValue);

  if (normalizedQuery.length === 1) {
    return normalizedPrimaryValues.some((value) =>
      value.startsWith(normalizedQuery),
    );
  }

  return [...normalizedPrimaryValues, ...secondaryValues.map(normalizeSearchValue)].some(
    (value) => value.includes(normalizedQuery),
  );
}
