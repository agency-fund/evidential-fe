import { mutate } from 'swr';

/**
 * Invalidate every SWR cache entry whose key starts with one of the given URL path prefixes,
 * optionally excluding specific exact-match paths.
 *
 * Generated SWR keys are tuples shaped like [`/v1/m/<resource>`, params?]. Calling
 * `mutate(getXxxKey())` only revalidates the no-params variant; pages that subscribe with query
 * params (pagination, filters, scopes) keep stale data. This helper matches by path prefix so a
 * mutation handler can refresh every parameterized variant in one call.
 *
 * The optional `exclude` list takes exact key paths to skip — useful when an item is being deleted
 * (so we want to refresh /v1/m/users but not revalidate /v1/m/users/{deletedId} into a 404).
 */
export const invalidatePath = (prefixes: string | string[], exclude?: string[]) => {
  const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
  const excludeSet = exclude ? new Set(exclude) : null;
  return mutate(
    (key) =>
      Array.isArray(key) &&
      typeof key[0] === 'string' &&
      !excludeSet?.has(key[0]) &&
      prefixList.some((prefix) => key[0].startsWith(prefix)),
  );
};
