import { SortedMapStructure, toArray } from '@collectable/sorted-map'

export function toSortedArray<V, U>(x: SortedMapStructure<number, V, U>): V[] {
  return toArray(x)
    .sort((a, b) => a[0] - b[0])
    .map(x => x[1])
}
