import { SortedMapStructure, toArray } from '@collectable/sorted-map'

export function toSortedArray<V, U>(
	map: SortedMapStructure<number, V, U>,
): V[] {
	return toArray(map)
		.sort((a, b) => a[0] - b[0])
		.map(x => x[1])
}
