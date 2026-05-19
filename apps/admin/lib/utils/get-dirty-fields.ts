import equal from "fast-deep-equal";

export function getDirtyFields<T extends Record<string, unknown>>(
  current: T,
  original: Partial<T>,
): Partial<T> {
  const dirty: Partial<T> = {};

  for (const key in current) {
    if (!equal(current[key], original[key])) {
      dirty[key] = current[key];
    }
  }

  return dirty;
}
