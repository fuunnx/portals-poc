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

test('multiple per line', () => {
  const source = ` // PORTAL #1, /PORTAL #1, WARP #1`
  expect(stringify(parse(source))).toEqual(source)
})

test('multiple destinations per line', () => {
  const source = `
// PORTAL #1, /PORTAL #1
// PORTAL #2, /PORTAL #2

// WARP #1, WARP #2`
  expect(stringify(parse(source))).toEqual(source)
})

test('partial content', () => {
  const source = `
// PORTAL #2, /PORTAL #2

// WARP #`
  expect(stringify(parse(source))).toEqual(source)
})
