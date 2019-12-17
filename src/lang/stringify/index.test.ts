import { parse } from '../parse'
import { stringify } from './index'

test('empty text', () => {
	const source = ''
	expect(stringify(parse(source))).toEqual(source)
})

test('simple text', () => {
	const source = `1
2
3`
	expect(stringify(parse(source))).toEqual(source)
})

test('less simple text', () => {
	const source = `// PORTAL #1
1
// /PORTAL #1
2
// WARP #1
3`
	expect(stringify(parse(source))).toEqual(source)
})
