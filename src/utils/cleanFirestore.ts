/**
 * Strips undefined properties from objects before persisting to Firebase Firestore.
 * Firestore rejects documents containing undefined values.
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}
