import { Context } from '../types'
import { toSortedArray } from '../../libs/SortedMap'
import { flatten } from 'ramda'
import { toArray } from '@collectable/sorted-map/'

export function stringify(context: Context): string {
  const lines = context.buffer.split('\n')

  type Pair = [number, Symbol]
  flatten(toArray(context.content)).reduce((acc, [index, symbol]) => {
    if (symbol.type === 'opening') {
    }
    return [index, symbol]
  }, [])

  return flatten()
    .map(symbol => {
      console.log(symbol)
      return lines.slice(symbol.start, (symbol.end || 0) + 1).join('\n')
    })
    .join('\n')
}
