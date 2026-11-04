/**
 * One instance per server process, shared by every route bundle. Next.js builds pages and route handlers
 * as separate bundles, so a plain module-level `new Cache()` would be a different cache in each of them.
 */
export function singleton<T>(name: string, create: () => T): T {
  const key = Symbol.for(`undead.${name}`);
  const store = globalThis as unknown as Record<symbol, T | undefined>;
  return (store[key] ??= create());
}
