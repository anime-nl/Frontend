const PREORDER_RELEASE_DATE_KEY = 'preorder_release_date'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Reads the release date a product is pre-ordered until, from its metadata `preorder_release_date` (YYYY-MM-DD).
 * Kept in step with `shared/utils/preorder.ts` of the storefront, because the Medusa project is deployed on its own
 * and cannot import from it.
 * @param metadata The product's metadata
 * @param now The moment to compare against, injectable for tests
 * @returns The release date as YYYY-MM-DD, or null when there is no valid date or it has already started
 */
export function getPreorderReleaseDate(
  metadata: Record<string, unknown> | null | undefined,
  now: Date = new Date()
): string | null {
  const value = metadata?.[PREORDER_RELEASE_DATE_KEY]
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return null

  const release = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(release.getTime()) || release.getTime() <= now.getTime()) return null
  return value
}
