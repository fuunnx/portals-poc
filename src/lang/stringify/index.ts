import { Context, Content, Symbol } from '../types'
import { toSortedArray } from '../../libs/SortedMap'

const SEPARATOR = '\n'

export function stringify(context: Context): string {
	const lines = context.buffer.split(SEPARATOR)

	return flattenSymbols(context.content)
		.map(symbol => {
			return lines.slice(symbol.start, (symbol.end || 0) + 1).join(SEPARATOR)
		})
		.join(SEPARATOR)

	function flattenSymbols(content: Content): Symbol[] {
		return toSortedArray(content).reduce((acc, symbols) => {
			symbols.forEach(symbol => {
				acc.push(symbol)
				if (symbol.type === 'opening') {
					acc.push(...flattenSymbols(context.portals[symbol.for].content))
				}
			})

			return acc
		}, [])
	}
}
