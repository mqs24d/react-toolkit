/* eslint-disable @typescript-eslint/no-explicit-any */
function is(x: unknown, y: unknown) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

export function shallowEquals(objA: unknown, objB: unknown): boolean {
  if (is(objA, objB)) return true;

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  if (Array.isArray(objA) && Array.isArray(objB)) {
    if (objA.length !== objB.length) return false;
    return objA.every((v, idx) => shallowEquals(v, objB[idx]));
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    if (!Object.hasOwn(objB, keysA[i]) || !is((objA as any)[keysA[i]], (objB as any)[keysA[i]])) {
      return false;
    }
  }

  return true;
}
